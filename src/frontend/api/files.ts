import type { FilesResponse, StorageResponse } from "../types/files";

// API 基础配置
const API_BASE_URL = "/api";

// 错误处理类
export class ApiError extends Error {
  public constructor(
    message: string,
    public status: number,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// 通用请求函数
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // 获取 token
  const token = localStorage.getItem("token");

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError("网络错误", 0, error);
  }
}

// 文件管理相关 API 函数
export const filesApi = {
  // 获取文件列表
  async getFileList(path?: string): Promise<FilesResponse> {
    const endpoint = path
      ? `/files/list/${encodeURIComponent(path)}`
      : "/files/list";
    return apiRequest<FilesResponse>(endpoint, {
      method: "GET",
    });
  },

  // 获取存储空间信息
  async getStorageInfo(): Promise<StorageResponse> {
    return apiRequest<StorageResponse>("/files/storage", {
      method: "GET",
    });
  },
};
