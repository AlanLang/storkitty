export interface FileInfo {
  name: string;
  path: string;
  file_type: "file" | "folder";
  size?: number;
  modified: string;
  items?: number; // 文件夹中的项目数量
}

export interface DirectoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  storage_type: string;
}

export interface FilesResponse {
  success: boolean;
  files: FileInfo[];
  current_path: string;
  message?: string;
}

export interface StorageInfo {
  used_bytes: number;
  total_bytes: number;
  used_percentage: number;
}

export interface StorageResponse {
  success: boolean;
  storage: StorageInfo;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

export interface CreateDirectoryResponse {
  success: boolean;
  message: string;
}

export interface RenameResponse {
  success: boolean;
  message: string;
}

export interface ReadmeResponse {
  success: boolean;
  content?: string;
  message?: string;
}

// Note: File config is now included in auth/verify response (types/auth.ts)
