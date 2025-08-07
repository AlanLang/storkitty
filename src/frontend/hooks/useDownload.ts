import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelDownloadTask,
  clearCompletedTasks,
  createDownloadTasks,
  getDownloadTasks,
} from "../api/download";
import {
  type CreateDownloadRequest,
  DownloadStatus,
  type DownloadTask,
} from "../types/download";

// Query Keys
export const downloadKeys = {
  all: ["downloads"] as const,
  lists: () => [...downloadKeys.all, "list"] as const,
  list: (directoryId?: string) =>
    [...downloadKeys.lists(), directoryId || "default"] as const,
};

// 获取下载任务列表 - 带智能轮询 (已废弃，使用 useDownloadTasksWithAuthQuery)
// export function useDownloadTasksQuery - 移除因为需要认证token

// 带认证的下载任务查询
export function useDownloadTasksWithAuthQuery(
  directoryId: string,
  token: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [...downloadKeys.list(directoryId), "auth"],
    queryFn: async () => {
      if (!token) throw new Error("No authentication token");
      return getDownloadTasks({ directory_id: directoryId }, token);
    },
    enabled: enabled && !!token,
    staleTime: 1000, // 1 second
    refetchInterval: (query) => {
      const data = query.state.data;

      // 如果查询正在进行中，等待结果
      if (query.state.status === "pending") {
        return 2000;
      }

      // 确保 data 存在且是数组
      if (!data || !Array.isArray(data) || data.length === 0) {
        return false;
      }

      const hasActiveOrPendingTasks = data.some(
        (task) =>
          task.status === DownloadStatus.Pending ||
          task.status === DownloadStatus.Downloading,
      );

      return hasActiveOrPendingTasks ? 2000 : false;
    },
    refetchIntervalInBackground: false,
  });
}

// 创建下载任务
export function useCreateDownloadTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      request,
      token,
    }: { request: CreateDownloadRequest; token: string }) =>
      createDownloadTasks(request, token),
    onSuccess: (response, { request }) => {
      if (response.success) {
        toast.success(response.message);
        // 刷新下载任务列表
        queryClient.invalidateQueries({
          queryKey: downloadKeys.list(request.directory_id),
        });
        // 刷新带认证的查询，立即开始轮询以获取新任务状态
        queryClient.refetchQueries({
          queryKey: [...downloadKeys.list(request.directory_id), "auth"],
        });
      } else {
        toast.error(response.message);
      }
    },
    onError: (error) => {
      console.error("创建下载任务失败:", error);
      toast.error("创建下载任务失败");
    },
  });
}

// 取消下载任务
export function useCancelDownloadTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      token,
    }: {
      taskId: string;
      token: string;
      directoryId: string;
    }) => cancelDownloadTask(taskId, token),
    onSuccess: (response, { directoryId }) => {
      // 只在失败时显示错误提示，成功时用户可以直观看到效果
      if (!response.success) {
        toast.error(response.message);
      }
      // 刷新任务列表
      queryClient.invalidateQueries({
        queryKey: downloadKeys.list(directoryId),
      });
    },
    onError: (error) => {
      console.error("取消任务失败:", error);
      toast.error("取消任务失败");
    },
  });
}

// 清理已完成任务
export function useClearCompletedTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      directoryId,
      token,
    }: { directoryId: string; token: string }) =>
      clearCompletedTasks(directoryId, token),
    onSuccess: (response, { directoryId }) => {
      // 只在失败时显示错误提示，成功时用户可以直观看到效果
      if (!response.success) {
        toast.error("清理任务失败");
      }
      // 刷新任务列表
      queryClient.invalidateQueries({
        queryKey: downloadKeys.list(directoryId),
      });
    },
    onError: (error) => {
      console.error("清理任务失败:", error);
      toast.error("清理任务失败");
    },
  });
}

// 获取下载统计信息的工具函数
export function getDownloadStats(tasks: DownloadTask[]) {
  const total = tasks.length;
  const downloading = tasks.filter(
    (task) =>
      task.status === DownloadStatus.Downloading ||
      task.status === DownloadStatus.Pending,
  ).length;
  const completed = tasks.filter(
    (task) => task.status === DownloadStatus.Completed,
  ).length;
  const failed = tasks.filter(
    (task) =>
      task.status === DownloadStatus.Failed ||
      task.status === DownloadStatus.Cancelled,
  ).length;

  return { total, downloading, completed, failed };
}
