import type { FileInfo } from "../types/files";

export interface UploadResponse {
  file_path: string;
  file_info: FileInfo;
}

export interface UploadError {
  message: string;
  code?: string;
}

/**
 * Upload a single file using directory-specific upload endpoint (unified API)
 */
export async function uploadFile(
  file: File,
  directoryId: string,
  targetPath?: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResponse> {
  return uploadFileWithDirectory(file, directoryId, targetPath, onProgress);
}

/**
 * Upload a single file to a specific directory using the directory-aware upload endpoint
 */
export async function uploadFileWithDirectory(
  file: File,
  directoryId: string,
  targetPath?: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResponse> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("fileName", file.name);
  if (targetPath) {
    formData.append("targetPath", targetPath);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (_error) {
          reject(new Error("无效的响应格式"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || `上传失败，状态码 ${xhr.status}`));
        } catch {
          reject(new Error(`上传失败，状态码 ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("上传过程中网络错误"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("上传已取消"));
    });

    xhr.open("POST", `/api/upload/${encodeURIComponent(directoryId)}/simple`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Upload multiple files sequentially (unified API)
 */
export async function uploadFiles(
  files: File[],
  directoryId: string,
  targetPath?: string,
  onProgress?: (fileIndex: number, progress: number, fileName: string) => void,
): Promise<UploadResponse[]> {
  return uploadFilesWithDirectory(files, directoryId, targetPath, onProgress);
}

/**
 * Upload multiple files sequentially to a specific directory
 */
export async function uploadFilesWithDirectory(
  files: File[],
  directoryId: string,
  targetPath?: string,
  onProgress?: (fileIndex: number, progress: number, fileName: string) => void,
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadFileWithDirectory(
        file,
        directoryId,
        targetPath,
        (progress) => onProgress?.(i, progress, file.name),
      );
      results.push(result);
    } catch (error) {
      // Continue with other files, but throw at the end if there were errors
      throw new Error(
        `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  return results;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  maxSizeMB?: number,
): { valid: boolean; error?: string } {
  // Use provided size or default to 100MB
  const maxSizeMBValue = maxSizeMB || 100;
  const MAX_SIZE = maxSizeMBValue * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size too large. Maximum allowed size is ${maxSizeMBValue}MB`,
    };
  }

  // File name validation
  if (!file.name || file.name.length > 255) {
    return {
      valid: false,
      error: "无效的文件名",
    };
  }

  // Check for dangerous file names
  if (
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    return {
      valid: false,
      error: "文件名包含无效字符",
    };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(1)} ${units[i]}`;
}
