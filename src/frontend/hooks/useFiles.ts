import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filesApi } from "../api/files";

// Query Keys
export const filesKeys = {
  all: ["files"] as const,
  lists: () => [...filesKeys.all, "list"] as const,
  list: (path?: string) => [...filesKeys.lists(), path || "root"] as const,
  storage: () => [...filesKeys.all, "storage"] as const,
};

// 获取文件列表
export function useFileListQuery(path?: string, enabled = true) {
  return useQuery({
    queryKey: filesKeys.list(path),
    queryFn: () => filesApi.getFileList(path),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// 获取存储空间信息
export function useStorageInfoQuery(enabled = true) {
  return useQuery({
    queryKey: filesKeys.storage(),
    queryFn: () => filesApi.getStorageInfo(),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// 删除文件 mutation
export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePath: string) => filesApi.deleteFile(filePath),
    onSuccess: () => {
      // 刷新所有文件列表查询
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      // 刷新存储空间信息
      queryClient.invalidateQueries({ queryKey: filesKeys.storage() });
    },
  });
}

// 创建目录 mutation
export function useCreateDirectoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (directoryPath: string) =>
      filesApi.createDirectory(directoryPath),
    onSuccess: () => {
      // 刷新所有文件列表查询
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      // 刷新存储空间信息
      queryClient.invalidateQueries({ queryKey: filesKeys.storage() });
    },
  });
}

// Note: File config is now included in auth/verify response
// useFileConfigQuery removed - use useAuth().fileConfig instead
