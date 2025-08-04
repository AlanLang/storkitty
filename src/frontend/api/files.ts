import type {
  CreateDirectoryResponse,
  DeleteResponse,
  FilesResponse,
  ReadmeResponse,
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

  // 展示指定目录中的文件内容（主要用于 Markdown 预览）
  async showFileContentWithDirectory(
    directoryId: string,
    filePath: string,
  ): Promise<ReadmeResponse> {
    const endpoint = `/files/${encodeURIComponent(directoryId)}/show/${encodeURIComponent(filePath)}`;
    return apiRequest<ReadmeResponse>(endpoint, {
      method: "GET",
    });
  },

  // 获取指定目录中的文件二进制内容（主要用于 PDF 预览）
  async getBinaryFileWithDirectory(
    directoryId: string,
    filePath: string,
  ): Promise<{ success: boolean; data?: ArrayBuffer; message?: string }> {
    try {
      const url = `/api/files/${encodeURIComponent(directoryId)}/download/${encodeURIComponent(filePath)}`;

      const response = await fetch(url, {
        method: "GET",
        // 不需要认证头，因为下载是公开的
      });

      if (!response.ok) {
        return {
          success: false,
          message: `HTTP error! status: ${response.status}`,
        };
      }

      const arrayBuffer = await response.arrayBuffer();
      // Clone the ArrayBuffer to prevent detachment issues
      const clonedBuffer = arrayBuffer.slice(0);

      return {
        success: true,
        data: clonedBuffer,
      };
    } catch (error) {
      console.error("Failed to fetch binary file:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "网络错误",
      };
    }
  },

  // Note: File config is now included in auth/verify response
};
