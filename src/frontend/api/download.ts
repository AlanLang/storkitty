import type {
  CreateDownloadRequest,
  CreateDownloadResponse,
  DownloadListQuery,
  DownloadTask,
} from "../types/download";

const API_BASE = "/api/download";

// 创建下载任务
export async function createDownloadTasks(
  request: CreateDownloadRequest,
  token: string,
): Promise<CreateDownloadResponse> {
  const response = await fetch(`${API_BASE}/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 获取下载任务列表
export async function getDownloadTasks(
  query: DownloadListQuery,
  token: string,
): Promise<DownloadTask[]> {
  const params = new URLSearchParams();
  if (query.status) params.append("status", query.status);
  if (query.directory_id) params.append("directory_id", query.directory_id);

  const response = await fetch(`${API_BASE}/list?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 取消下载任务
export async function cancelDownloadTask(
  taskId: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/cancel/${taskId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 格式化文件大小
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

// 格式化下载速度
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

// 格式化时间（秒）
export function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}秒`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}小时${minutes}分钟`;
}

// 从URL提取文件名
export function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const segments = pathname
      .split("/")
      .filter((segment) => segment.length > 0);

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.includes(".")) {
        return lastSegment;
      }
    }

    // 如果无法提取文件名，返回默认名称
    return "download.bin";
  } catch {
    return "download.bin";
  }
}

// 清理已完成的任务
export async function clearCompletedTasks(
  directoryId: string,
  token: string,
): Promise<{ success: boolean; cleared_count: number; message: string }> {
  const params = new URLSearchParams();
  params.append("directory_id", directoryId);

  const response = await fetch(`${API_BASE}/clear?${params}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// 验证URL格式
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
