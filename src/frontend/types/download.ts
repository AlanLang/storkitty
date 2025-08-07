export interface DownloadTask {
  id: string;
  url: string;
  filename: string;
  directory_id: string;
  target_path: string;
  status: DownloadStatus;
  downloaded_bytes: number;
  total_bytes?: number;
  download_speed: number; // bytes per second
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export enum DownloadStatus {
  Pending = "Pending",
  Downloading = "Downloading",
  Completed = "Completed",
  Failed = "Failed",
  Cancelled = "Cancelled",
}

export interface DownloadProgress {
  task_id: string;
  status: DownloadStatus;
  downloaded_bytes: number;
  total_bytes?: number;
  progress_percent?: number;
  download_speed: number;
  eta_seconds?: number;
  error_message?: string;
}

export interface CreateDownloadRequest {
  urls: string[];
  directory_id: string;
  target_path?: string;
}

export interface CreateDownloadResponse {
  success: boolean;
  task_ids: string[];
  message: string;
}

export interface DownloadListQuery {
  status?: string;
  directory_id?: string;
}

// 用于格式化的辅助类型
export interface FormattedDownloadTask
  extends Omit<
    DownloadTask,
    "download_speed" | "downloaded_bytes" | "total_bytes"
  > {
  download_speed_formatted: string;
  downloaded_bytes_formatted: string;
  total_bytes_formatted?: string;
  progress_percent?: number;
  eta_formatted?: string;
}
