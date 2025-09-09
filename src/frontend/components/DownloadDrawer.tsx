import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { formatBytes, formatSpeed, formatTime } from "../api/download";
import { useAuth } from "../hooks/useAuth";
import { useDirectoryContext } from "../hooks/useDirectoryContext";
import {
  useCancelDownloadTaskMutation,
  useClearCompletedTasksMutation,
  useDownloadTasksWithAuthQuery,
} from "../hooks/useDownload";
import { DownloadStatus, type DownloadTask } from "../types/download";
import { Button } from "./ui/button";

interface DownloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DownloadDrawer({ isOpen, onClose }: DownloadDrawerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { token } = useAuth();
  const { selectedDirectoryId } = useDirectoryContext();

  // 使用智能轮询的 React Query hooks
  const {
    data: tasks = [],
    isLoading,
    refetch: refetchTasks,
  } = useDownloadTasksWithAuthQuery(
    selectedDirectoryId,
    token,
    !!token && !!selectedDirectoryId && isOpen,
  );

  // Mutations
  const cancelTaskMutation = useCancelDownloadTaskMutation();
  const clearCompletedMutation = useClearCompletedTasksMutation();

  // Handle drawer animations
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      return () => clearTimeout(timer);
    }
    if (isVisible) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible]);

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    if (!token) return;

    cancelTaskMutation.mutate({
      taskId,
      token,
      directoryId: selectedDirectoryId,
    });
  };

  // 清理已完成的任务
  const handleClearCompleted = async () => {
    if (!token || !selectedDirectoryId) return;

    clearCompletedMutation.mutate({
      directoryId: selectedDirectoryId,
      token,
    });
  };

  // 获取状态图标
  const getStatusIcon = (status: DownloadStatus) => {
    switch (status) {
      case DownloadStatus.Pending:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case DownloadStatus.Downloading:
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case DownloadStatus.Completed:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case DownloadStatus.Failed:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case DownloadStatus.Cancelled:
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // 获取状态文本
  const getStatusText = (status: DownloadStatus) => {
    switch (status) {
      case DownloadStatus.Pending:
        return "等待中";
      case DownloadStatus.Downloading:
        return "下载中";
      case DownloadStatus.Completed:
        return "已完成";
      case DownloadStatus.Failed:
        return "失败";
      case DownloadStatus.Cancelled:
        return "已取消";
      default:
        return "未知";
    }
  };

  // 计算进度百分比
  const getProgressPercent = (task: DownloadTask): number => {
    if (task.status === DownloadStatus.Completed) return 100;
    if (!task.total_bytes || task.total_bytes === 0) return 0;
    return Math.min((task.downloaded_bytes / task.total_bytes) * 100, 100);
  };

  // 计算ETA
  const getETA = (task: DownloadTask): string => {
    if (
      task.status !== DownloadStatus.Downloading ||
      task.download_speed === 0
    ) {
      return "";
    }

    if (!task.total_bytes) return "";

    const remainingBytes = task.total_bytes - task.downloaded_bytes;
    const etaSeconds = Math.ceil(remainingBytes / task.download_speed);
    return formatTime(etaSeconds);
  };

  // 过滤任务（按状态分组）- 使用 useMemo 优化性能
  const { activeTasks, completedTasks, failedTasks } = useMemo(() => {
    const activeTasks = tasks.filter(
      (task) =>
        task.status === DownloadStatus.Pending ||
        task.status === DownloadStatus.Downloading,
    );

    const completedTasks = tasks.filter(
      (task) => task.status === DownloadStatus.Completed,
    );

    const failedTasks = tasks.filter(
      (task) =>
        task.status === DownloadStatus.Failed ||
        task.status === DownloadStatus.Cancelled,
    );

    return { activeTasks, completedTasks, failedTasks };
  }, [tasks]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="关闭下载管理器"
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[28rem] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 shadow-xl transition-transform duration-300 ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <h2 className="text-lg font-semibold">下载管理器</h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* 清理已完成任务按钮 - 仅在有完成或失败的任务时显示 */}
            {(completedTasks.length > 0 || failedTasks.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearCompleted}
                disabled={isLoading}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                清理已完成
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchTasks()}
              disabled={isLoading}
              className="gap-2"
            >
              <RotateCcw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              刷新
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="ml-2">加载中...</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无下载任务</p>
              <p className="text-sm">点击"远程下载"开始下载文件</p>
            </div>
          ) : (
            <>
              {/* 活跃任务 */}
              {activeTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    进行中 ({activeTasks.length})
                  </h3>
                  {activeTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={handleCancelTask}
                      getProgressPercent={getProgressPercent}
                      getStatusIcon={getStatusIcon}
                      getStatusText={getStatusText}
                      getETA={getETA}
                    />
                  ))}
                </div>
              )}

              {/* 已完成任务 */}
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    已完成 ({completedTasks.length})
                  </h3>
                  {completedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={handleCancelTask}
                      getProgressPercent={getProgressPercent}
                      getStatusIcon={getStatusIcon}
                      getStatusText={getStatusText}
                      getETA={getETA}
                    />
                  ))}
                </div>
              )}

              {/* 失败任务 */}
              {failedTasks.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-sm text-muted-foreground">
                    失败/已取消 ({failedTasks.length})
                  </h3>
                  {failedTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onCancel={handleCancelTask}
                      getProgressPercent={getProgressPercent}
                      getStatusIcon={getStatusIcon}
                      getStatusText={getStatusText}
                      getETA={getETA}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 任务项组件
interface TaskItemProps {
  task: DownloadTask;
  onCancel: (taskId: string) => void;
  getProgressPercent: (task: DownloadTask) => number;
  getStatusIcon: (status: DownloadStatus) => ReactNode;
  getStatusText: (status: DownloadStatus) => string;
  getETA: (task: DownloadTask) => string;
}

function TaskItem({
  task,
  onCancel,
  getProgressPercent,
  getStatusIcon,
  getStatusText,
  getETA,
}: TaskItemProps) {
  const progress = getProgressPercent(task);
  const eta = getETA(task);
  const canCancel =
    task.status === DownloadStatus.Pending ||
    task.status === DownloadStatus.Downloading;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      {/* 文件信息头部 */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(task.status)}
            <span className="font-medium truncate flex-shrink">
              {task.filename}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {getStatusText(task.status)}
            </span>
          </div>
          <div
            className="text-sm text-muted-foreground break-all"
            style={{
              wordBreak: "break-all",
              overflowWrap: "break-word",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {task.url}
          </div>
        </div>

        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancel(task.id)}
            className="ml-2 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 进度条 */}
      {(task.status === DownloadStatus.Downloading ||
        task.status === DownloadStatus.Completed) && (
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              {formatBytes(task.downloaded_bytes)}
              {task.total_bytes && ` / ${formatBytes(task.total_bytes)}`}
            </span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                task.status === DownloadStatus.Completed
                  ? "bg-green-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* 下载信息 */}
      {task.status === DownloadStatus.Downloading && (
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            {task.download_speed > 0
              ? formatSpeed(task.download_speed)
              : "计算中..."}
          </span>
          {eta && <span>剩余: {eta}</span>}
        </div>
      )}

      {/* 错误信息 */}
      {task.error_message && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {task.error_message}
        </div>
      )}
    </div>
  );
}
