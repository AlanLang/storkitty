import type {
  CreateDirectoryResponse,
  DeleteResponse,
  FilesResponse,
  RenameResponse,
  StorageResponse,
} from "../types/files";

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
  // 获取指定目录的文件列表
  async getFileListWithDirectory(
    directoryId: string,
    path?: string,
  ): Promise<FilesResponse> {
    const endpoint = path
      ? `/files/${encodeURIComponent(directoryId)}/list/${encodeURIComponent(path)}`
      : `/files/${encodeURIComponent(directoryId)}/list`;
    return apiRequest<FilesResponse>(endpoint, {
      method: "GET",
    });
  },

  // 获取指定目录的存储空间信息
  async getStorageInfoWithDirectory(
    directoryId: string,
  ): Promise<StorageResponse> {
    return apiRequest<StorageResponse>(
      `/files/${encodeURIComponent(directoryId)}/storage`,
      {
        method: "GET",
      },
    );
  },

  // 删除指定目录中的文件或目录
  async deleteFileWithDirectory(
    directoryId: string,
    filePath: string,
  ): Promise<DeleteResponse> {
    const response = await apiRequest<DeleteResponse>(
      `/files/${encodeURIComponent(directoryId)}/delete/${encodeURIComponent(filePath)}`,
      {
        method: "DELETE",
      },
    );

    // 检查操作是否成功，如果失败则抛出错误
    if (!response.success) {
      throw new ApiError(response.message, 400, response);
    }

    return response;
  },

  // 在指定目录中创建目录
  async createDirectoryWithDirectory(
    directoryId: string,
    directoryPath: string,
  ): Promise<CreateDirectoryResponse> {
    const response = await apiRequest<CreateDirectoryResponse>(
      `/files/${encodeURIComponent(directoryId)}/mkdir/${encodeURIComponent(directoryPath)}`,
      {
        method: "POST",
      },
    );

    // 检查操作是否成功，如果失败则抛出错误
    if (!response.success) {
      throw new ApiError(response.message, 400, response);
    }

    return response;
  },

  // 重命名指定目录中的文件或目录
  async renameFileWithDirectory(
    directoryId: string,
    filePath: string,
    newName: string,
  ): Promise<RenameResponse> {
    return apiRequest<RenameResponse>(
      `/files/${encodeURIComponent(directoryId)}/rename/${encodeURIComponent(filePath)}`,
      {
        method: "PUT",
        body: JSON.stringify({ new_name: newName }),
      },
    );
  },

  // Note: File config is now included in auth/verify response
};
