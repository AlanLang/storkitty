import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filesApi } from "../api/files";

// Query Keys
export const filesKeys = {
  all: ["files"] as const,
  directories: () => [...filesKeys.all, "directories"] as const,
  lists: () => [...filesKeys.all, "list"] as const,
  list: (path?: string, directoryId?: string) =>
    [...filesKeys.lists(), directoryId || "default", path || "root"] as const,
  storage: (directoryId?: string) =>
    [...filesKeys.all, "storage", directoryId || "default"] as const,
  show: (filePath: string, directoryId: string) =>
    [...filesKeys.all, "show", directoryId, filePath] as const,
  binary: (filePath: string, directoryId: string) =>
    [...filesKeys.all, "binary", directoryId, filePath] as const,
};

// Legacy function - now redirects to directory-based API
export function useFileListQuery(_path?: string, _enabled = true) {
  throw new Error(
    "Legacy useFileListQuery is deprecated. Use useFileListWithDirectoryQuery instead.",
  );
}

// 获取指定目录的文件列表
export function useFileListWithDirectoryQuery(
  directoryId: string,
  path?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: filesKeys.list(path, directoryId),
    queryFn: () => filesApi.getFileListWithDirectory(directoryId, path),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Legacy function - now redirects to directory-based API
export function useStorageInfoQuery(_enabled = true) {
  throw new Error(
    "Legacy useStorageInfoQuery is deprecated. Use useStorageInfoWithDirectoryQuery instead.",
  );
}

// 获取指定目录的存储空间信息
export function useStorageInfoWithDirectoryQuery(
  directoryId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: filesKeys.storage(directoryId),
    queryFn: () => filesApi.getStorageInfoWithDirectory(directoryId),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

// 删除文件 mutation（支持目录选择）
export function useDeleteFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      filePath,
      directoryId,
    }: { filePath: string; directoryId: string }) => {
      return filesApi.deleteFileWithDirectory(directoryId, filePath);
    },
    onSuccess: (_, { directoryId }) => {
      // 刷新所有文件列表查询
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      // 刷新相应的存储空间信息
      queryClient.invalidateQueries({
        queryKey: filesKeys.storage(directoryId),
      });
    },
  });
}

// 创建目录 mutation（支持目录选择）
export function useCreateDirectoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      directoryPath,
      directoryId,
    }: { directoryPath: string; directoryId: string }) => {
      return filesApi.createDirectoryWithDirectory(directoryId, directoryPath);
    },
    onSuccess: (_, { directoryId }) => {
      // 刷新所有文件列表查询
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      // 刷新相应的存储空间信息
      queryClient.invalidateQueries({
        queryKey: filesKeys.storage(directoryId),
      });
    },
  });
}

// 重命名文件 mutation（支持目录选择）
export function useRenameFileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      filePath,
      newName,
      directoryId,
    }: { filePath: string; newName: string; directoryId: string }) => {
      return filesApi.renameFileWithDirectory(directoryId, filePath, newName);
    },
    onSuccess: (_, { directoryId }) => {
      // 只有真正成功时才刷新
      queryClient.invalidateQueries({ queryKey: filesKeys.lists() });
      // 刷新相应的存储空间信息
      queryClient.invalidateQueries({
        queryKey: filesKeys.storage(directoryId),
      });
    },
  });
}

// 展示指定目录中的文件内容
export function useShowFileQuery(
  directoryId: string,
  filePath: string,
  enabled = true,
) {
  return useQuery({
    queryKey: filesKeys.show(filePath, directoryId),
    queryFn: () => filesApi.showFileContentWithDirectory(directoryId, filePath),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// 获取指定目录中的文件二进制内容（主要用于PDF预览）
export function useFileBinaryQuery(
  directoryId: string,
  filePath: string,
  enabled = true,
) {
  return useQuery({
    queryKey: filesKeys.binary(filePath, directoryId),
    queryFn: () => filesApi.getBinaryFileWithDirectory(directoryId, filePath),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// 保存文件内容 mutation
export function useSaveFileMutation(directoryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      filePath,
      content,
    }: { filePath: string; content: string }) =>
      filesApi.saveFileContentWithDirectory(directoryId, filePath, content),
    retry: 0,
    onSuccess: (_, { filePath }) => {
      // 保存成功后，刷新相关缓存
      queryClient.invalidateQueries({
        queryKey: filesKeys.show(filePath, directoryId),
      });
      queryClient.invalidateQueries({
        queryKey: filesKeys.binary(filePath, directoryId),
      });
    },
  });
}

// Note: File config is now included in auth/verify response
// useFileConfigQuery removed - use useAuth().fileConfig instead
