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

export interface CreateFileResponse {
  success: boolean;
  message: string;
}

export interface MoveResponse {
  success: boolean;
  message: string;
}

export interface MoveRequest {
  source_path: string;
  target_path: string;
}

export interface CopyResponse {
  success: boolean;
  message: string;
}

export interface CopyRequest {
  source_path: string;
  target_path: string;
}

// 剪贴板状态管理相关类型
export interface ClipboardItem {
  file: FileInfo;
  operation: "move" | "copy";
  directoryId: string;
  sourcePath: string; // 完整的文件路径（相对于目录根）
}

export interface ClipboardState {
  item: ClipboardItem | null;
}

// Note: File config is now included in auth/verify response (types/auth.ts)
