import type { DirectoryInfo } from "./files";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message: string;
}

export interface UserInfo {
  username: string;
  email: string;
}

export interface FileConfigInfo {
  max_file_size_mb: number;
  allowed_extensions: string[];
  blocked_extensions: string[];
}

export interface VerifyResponse {
  user: UserInfo;
  file_config: FileConfigInfo;
  directories: DirectoryInfo[];
}

export interface SetupRequest {
  username: string;
  password: string;
  email: string;
}

export interface SetupResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface SetupStatusResponse {
  needs_setup: boolean;
}
