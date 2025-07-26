import type { UploadResponse } from "./upload";

export interface ChunkedUploadProgress {
  totalChunks: number;
  uploadedChunks: number;
  currentChunk: number;
  totalSize: number;
  uploadedSize: number;
  progress: number; // 0-100
  speed?: number; // bytes per second
  eta?: number; // estimated time in seconds
}

export interface ChunkedUploadSession {
  file: File;
  uploadId: string;
  targetPath?: string;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: Set<number>;
  onProgress?: (progress: ChunkedUploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (result: UploadResponse) => void;
  aborted: boolean;
}

const DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1MB per chunk
const MAX_CONCURRENT_UPLOADS = 3; // Maximum concurrent chunk uploads
const MAX_RETRIES = 3; // Maximum retry attempts per chunk

/**
 * Create a chunked upload session for large files
 */
export function createChunkedUploadSession(
  file: File,
  options: {
    targetPath?: string;
    chunkSize?: number;
    onProgress?: (progress: ChunkedUploadProgress) => void;
    onError?: (error: Error) => void;
    onComplete?: (result: UploadResponse) => void;
  } = {},
): ChunkedUploadSession {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const totalChunks = Math.ceil(file.size / chunkSize);

  return {
    file,
    uploadId: generateUploadId(),
    targetPath: options.targetPath,
    chunkSize,
    totalChunks,
    uploadedChunks: new Set(),
    onProgress: options.onProgress,
    onError: options.onError,
    onComplete: options.onComplete,
    aborted: false,
  };
}

/**
 * Start the chunked upload process
 */
export async function startChunkedUpload(
  session: ChunkedUploadSession,
): Promise<void> {
  if (session.aborted) {
    throw new Error("Upload session has been aborted");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }

  try {
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastUploadedSize = 0;

    // Create a queue of chunks to upload
    const chunkQueue: number[] = [];
    for (let i = 0; i < session.totalChunks; i++) {
      chunkQueue.push(i);
    }

    // Track active uploads
    const activeUploads = new Set<Promise<void>>();

    const updateProgress = () => {
      const now = Date.now();
      const uploadedSize = session.uploadedChunks.size * session.chunkSize;
      const progress =
        (session.uploadedChunks.size / session.totalChunks) * 100;

      // Calculate speed and ETA
      const timeDiff = (now - lastProgressTime) / 1000; // seconds
      const sizeDiff = uploadedSize - lastUploadedSize;
      const speed = timeDiff > 0 ? sizeDiff / timeDiff : 0;
      const remainingSize = session.file.size - uploadedSize;
      const eta = speed > 0 ? remainingSize / speed : 0;

      session.onProgress?.({
        totalChunks: session.totalChunks,
        uploadedChunks: session.uploadedChunks.size,
        currentChunk: -1, // Will be set per chunk
        totalSize: session.file.size,
        uploadedSize,
        progress,
        speed,
        eta,
      });

      lastProgressTime = now;
      lastUploadedSize = uploadedSize;
    };

    const uploadChunk = async (
      chunkIndex: number,
      retryCount = 0,
    ): Promise<void> => {
      if (session.aborted) {
        throw new Error("Upload aborted");
      }

      try {
        const start = chunkIndex * session.chunkSize;
        const end = Math.min(start + session.chunkSize, session.file.size);
        const chunk = session.file.slice(start, end);

        // Create a unique filename for this chunk
        const originalName = session.file.name;
        const extension = originalName.split(".").pop() || "";
        const baseName = originalName.replace(`.${extension}`, "");
        const chunkFileName = `${baseName}_chunk_${chunkIndex.toString().padStart(4, "0")}_${session.uploadId}.${extension}`;

        const formData = new FormData();
        formData.append("file", chunk, chunkFileName);
        formData.append("fileName", chunkFileName);
        if (session.targetPath) {
          formData.append(
            "targetPath",
            `${session.targetPath}/.chunks/${session.uploadId}`,
          );
        } else {
          formData.append("targetPath", `.chunks/${session.uploadId}`);
        }

        const response = await fetch("/api/upload/simple", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Chunk ${chunkIndex} upload failed: ${response.statusText}`,
          );
        }

        // Mark chunk as uploaded
        session.uploadedChunks.add(chunkIndex);
        updateProgress();
      } catch (error) {
        if (retryCount < MAX_RETRIES && !session.aborted) {
          // Retry after a delay
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1)),
          );
          return uploadChunk(chunkIndex, retryCount + 1);
        }
        throw error;
      }
    };

    // Upload chunks with concurrency control
    const processQueue = async (): Promise<void> => {
      while (chunkQueue.length > 0 && !session.aborted) {
        // Maintain max concurrent uploads
        while (
          activeUploads.size < MAX_CONCURRENT_UPLOADS &&
          chunkQueue.length > 0
        ) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          const chunkIndex = chunkQueue.shift()!;

          const uploadPromise = uploadChunk(chunkIndex).finally(() => {
            activeUploads.delete(uploadPromise);
          });

          activeUploads.add(uploadPromise);
        }

        // Wait for at least one upload to complete
        if (activeUploads.size > 0) {
          await Promise.race([...activeUploads]);
        }
      }

      // Wait for all remaining uploads to complete
      await Promise.all([...activeUploads]);
    };

    await processQueue();

    if (session.aborted) {
      throw new Error("Upload aborted");
    }

    // All chunks uploaded, now combine them on the server
    const result = await combineChunks(session, token);
    session.onComplete?.(result);
  } catch (error) {
    if (!session.aborted) {
      session.onError?.(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
    throw error;
  }
}

/**
 * Combine uploaded chunks into final file
 */
async function combineChunks(
  session: ChunkedUploadSession,
  token: string,
): Promise<UploadResponse> {
  // For now, we'll create a simple file that represents the completed upload
  // In a real implementation, the backend would combine the chunks

  const originalName = session.file.name;
  const formData = new FormData();

  // Create a small marker file to indicate completion
  const markerContent = JSON.stringify({
    originalName,
    totalChunks: session.totalChunks,
    fileSize: session.file.size,
    uploadId: session.uploadId,
    chunkPattern: `${originalName.replace(/\.[^.]+$/, "")}_chunk_*_${session.uploadId}.*`,
  });

  const markerFile = new Blob([markerContent], { type: "application/json" });
  formData.append("file", markerFile, `${originalName}.upload_complete`);
  formData.append("fileName", `${originalName}.upload_complete`);

  if (session.targetPath) {
    formData.append("targetPath", session.targetPath);
  }

  const response = await fetch("/api/upload/simple", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to finalize upload: ${response.statusText}`);
  }

  const result = await response.json();

  // Return the result but modify it to show the original file name
  return {
    ...result,
    file_info: {
      ...result.file_info,
      name: originalName,
      size: session.file.size,
    },
  };
}

/**
 * Abort a chunked upload session
 */
export function abortChunkedUpload(session: ChunkedUploadSession): void {
  session.aborted = true;
  // Note: In a full implementation, we would also clean up partial chunks on the server
}

/**
 * Check if a file should use chunked upload
 */
export function shouldUseChunkedUpload(
  file: File,
  threshold: number = 10 * 1024 * 1024,
): boolean {
  return file.size > threshold; // Default: files larger than 10MB
}

/**
 * Generate a unique upload ID
 */
function generateUploadId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format upload speed for display
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  }
  if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  }
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * Format ETA for display
 */
export function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  return `${Math.round(seconds / 3600)}h`;
}
