import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  cancelDownloadTask,
  formatBytes,
  formatSpeed,
  formatTime,
  getDownloadTasks,
} from "../api/download";
import { useAuth } from "../hooks/useAuth";
import { useDirectoryContext } from "../hooks/useDirectoryContext";
import { DownloadStatus, type DownloadTask } from "../types/download";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

export function DownloadManager() {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const { selectedDirectoryId } = useDirectoryContext();

  // 加载下载任务
  const loadTasks = useCallback(async () => {
    if (!token || !selectedDirectoryId) return;

    setIsLoading(true);
    try {
      const taskList = await getDownloadTasks(
        { directory_id: selectedDirectoryId },
        token,
      );
      setTasks(taskList);
    } catch (error) {
      console.error("获取下载任务失败:", error);
      toast.error("获取下载任务失败");
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedDirectoryId]);

  // 取消任务
  const handleCancelTask = async (taskId: string) => {
    if (!token) return;

    try {
      const response = await cancelDownloadTask(taskId, token);
      if (response.success) {
        toast.success(response.message);
        await loadTasks(); // 重新加载任务列表
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("取消任务失败:", error);
      toast.error("取消任务失败");
    }
  };

  // 监听SSE进度更新
  useEffect(() => {
    if (!token || !open) return;

    // 这里应该建立SSE连接监听进度更新
    // 但由于EventSource的限制，我们暂时使用轮询
    const interval = setInterval(() => {
      loadTasks();
    }, 2000); // 每2秒更新一次

    return () => clearInterval(interval);
  }, [token, open, loadTasks]);

  // 组件打开时加载任务
  useEffect(() => {
    if (open) {
      loadTasks();
    }
  }, [open, loadTasks]);

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

  // 过滤任务（按状态分组）
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Download className="h-4 w-4" />
          下载管理
          {activeTasks.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              {activeTasks.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            下载管理器
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
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

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => loadTasks()}
            disabled={isLoading}
            className="gap-2"
          >
            <RotateCcw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            刷新
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 任务项组件
interface TaskItemProps {
  task: DownloadTask;
  onCancel: (taskId: string) => void;
  getProgressPercent: (task: DownloadTask) => number;
  getStatusIcon: (status: DownloadStatus) => JSX.Element;
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getStatusIcon(task.status)}
            <span className="font-medium truncate">{task.filename}</span>
            <span className="text-xs text-muted-foreground">
              {getStatusText(task.status)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground truncate">
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
