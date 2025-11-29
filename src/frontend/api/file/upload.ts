import { http } from "@/api/http";
import type { Progress } from "@/hooks/use-file-upload";
import { token } from "@/lib/token";

const DEFAULT_CHUNK_SIZE = 3 * 1024 * 1024; // 3MB

type FileTask = {
  file: File;
  path: string;
  chunks: ChunkTask[];
  progress: {
    onProgress: (p: Progress) => void;
    transferredBytes: number[];
    onError: (error: unknown) => void;
  };
};

type ChunkTask = {
  fileTask: FileTask;
  chunkIndex: number;
  start: number;
  end: number;
  totalChunks: number;
  controller: AbortController;
};

export class FileUploader {
  private maxFiles: number;
  private maxChunks: number;
  private chunkSize: number;

  private pendingFiles: FileTask[] = [];
  private activeFiles: Set<FileTask> = new Set();

  private pendingChunks: ChunkTask[] = [];
  private activeChunks: Set<ChunkTask> = new Set();

  constructor(options?: {
    maxFiles?: number;
    maxChunks?: number;
    chunkSize?: number;
  }) {
    this.maxFiles = options?.maxFiles ?? 3;
    this.maxChunks = options?.maxChunks ?? 5;
    this.chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  }

  /** 添加一个文件任务 */
  public addFile(
    path: string,
    file: File,
    onProgress: (p: Progress) => void,
    onError: (error: unknown) => void,
  ) {
    const totalChunks = Math.ceil(file.size / this.chunkSize);
    const fileTask: FileTask = {
      file,
      path,
      progress: {
        onProgress,
        transferredBytes: Array(totalChunks).fill(0),
        onError,
      },
      chunks: [],
    };

    for (let i = 0; i < totalChunks; i++) {
      const start = i * this.chunkSize;
      const end = Math.min(start + this.chunkSize, file.size);
      const controller = new AbortController();

      fileTask.chunks.push({
        fileTask,
        chunkIndex: i,
        start,
        end,
        totalChunks,
        controller,
      });
    }

    this.pendingFiles.push(fileTask);
    this.schedule();
  }

  public abortFile(file: File) {
    const pendingFileTask = this.pendingFiles.find(
      (t) => t.file.name === file.name,
    );
    if (pendingFileTask) {
      this.pendingFiles = this.pendingFiles.filter(
        (t) => t.file.name !== file.name,
      );
      this.pendingChunks.forEach((chunk) => {
        if (chunk.fileTask.file.name === file.name) {
          chunk.controller.abort();
        }
      });
      this.pendingChunks = this.pendingChunks.filter(
        (t) => t.fileTask.file.name !== file.name,
      );
      this.checkFileDone(pendingFileTask);
      return;
    }
    const fileTask = Array.from(this.activeFiles).find(
      (t) => t.file.name === file.name,
    );
    if (fileTask) {
      this.activeFiles.delete(fileTask);
      this.activeChunks.forEach((chunk) => {
        if (chunk.fileTask.file.name === file.name) {
          chunk.controller.abort();
          this.activeChunks.delete(chunk);
        }
      });
      this.pendingChunks.forEach((chunk) => {
        if (chunk.fileTask.file.name === file.name) {
          chunk.controller.abort();
        }
      });
      this.pendingChunks = this.pendingChunks.filter(
        (t) => t.fileTask.file.name !== file.name,
      );
      http.post(`file/abort/${fileTask.path}`, {
        json: {
          file: file.name,
        },
      });
      this.checkFileDone(fileTask);
      this.schedule(); // 下一个调度
    }
  }

  /** 主调度器 */
  private schedule() {
    this.scheduleFiles();
    this.scheduleChunks();
  }

  /** 限制最大文件并发 */
  private scheduleFiles() {
    while (
      this.activeFiles.size < this.maxFiles &&
      this.pendingFiles.length > 0
    ) {
      const fileTask = this.pendingFiles.shift();
      if (fileTask) {
        this.activeFiles.add(fileTask);

        // 将该文件的 chunk 放入全局 chunk 队列
        for (const chunk of fileTask.chunks) {
          this.pendingChunks.push(chunk);
        }
      }
    }
  }

  /** 限制全局 chunk 并发 */
  private scheduleChunks() {
    while (
      this.activeChunks.size < this.maxChunks &&
      this.pendingChunks.length > 0
    ) {
      const chunkTask = this.pendingChunks.shift();
      chunkTask && this.uploadChunk(chunkTask);
    }
  }

  /** 上传单片 */
  private async uploadChunk(task: ChunkTask) {
    const { fileTask, chunkIndex, start, end } = task;
    const { file, path, progress } = fileTask;

    this.activeChunks.add(task);

    const blob = file.slice(start, end);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Setup abort handler
      task.controller.signal.addEventListener("abort", () => {
        xhr.abort();
        reject(new Error("Aborted"));
      });

      xhr.open("POST", `/api/file/upload/${path}`, true);

      // Set headers
      const tokenStr = token.get();
      if (tokenStr) {
        xhr.setRequestHeader("Authorization", `Bearer ${tokenStr}`);
      }
      xhr.setRequestHeader("X-Chunk-Index", chunkIndex.toString());
      xhr.setRequestHeader("X-Total-Chunks", task.totalChunks.toString());
      xhr.setRequestHeader("X-Filename", encodeURIComponent(file.name));
      xhr.setRequestHeader("Content-Type", "application/octet-stream");

      // Progress handler
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          progress.transferredBytes[chunkIndex] = e.loaded;
          const uploaded = progress.transferredBytes.reduce((s, v) => s + v, 0);
          progress.onProgress({
            percent: Math.min(uploaded / file.size, 1),
            transferredBytes: uploaded,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Ensure chunk is marked as fully uploaded
          progress.transferredBytes[chunkIndex] = blob.size;
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error"));
      };

      xhr.send(blob);
    })
      .catch((error) => {
        if (error.message !== "Aborted") {
          progress.onError(error);
        }
      })
      .finally(() => {
        this.activeChunks.delete(task);
        this.checkFileDone(fileTask);
        this.schedule(); // 下一个调度
      });
  }

  /** 检查文件是否已经全部完成 */
  private checkFileDone(fileTask: FileTask) {
    const finishedChunks = fileTask.progress.transferredBytes.filter(
      (x) => x > 0,
    ).length;

    if (finishedChunks === fileTask.chunks.length) {
      this.activeFiles.delete(fileTask);
      // Ensure 100% progress
      fileTask.progress.onProgress({
        percent: 1,
        transferredBytes: fileTask.file.size,
      });
    }
  }
}
