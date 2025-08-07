import { AlertCircle, ArrowDown, CheckCircle, Download } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDirectoryContext } from "../hooks/useDirectoryContext";
import {
  getDownloadStats,
  useDownloadTasksWithAuthQuery,
} from "../hooks/useDownload";
import { Button } from "./ui/button";

interface DownloadIndicatorProps {
  onOpenDrawer: () => void;
}

export function DownloadIndicator({ onOpenDrawer }: DownloadIndicatorProps) {
  const { token } = useAuth();
  const { selectedDirectoryId } = useDirectoryContext();

  // 使用智能轮询的 React Query hook
  const { data: tasks = [] } = useDownloadTasksWithAuthQuery(
    selectedDirectoryId,
    token,
    !!token && !!selectedDirectoryId,
  );

  // 计算统计信息
  const stats = useMemo(() => getDownloadStats(tasks), [tasks]);

  // 如果没有任务，不显示指示器
  if (stats.total === 0) return null;

  const hasActiveDownloads = stats.downloading > 0;
  const hasFailures = stats.failed > 0;
  const allCompleted = stats.completed === stats.total && stats.total > 0;

  const getIndicatorColor = () => {
    if (hasFailures && stats.downloading === 0)
      return "bg-red-500 hover:bg-red-600";
    if (hasActiveDownloads) return "bg-blue-500 hover:bg-blue-600";
    if (allCompleted) return "bg-green-500 hover:bg-green-600";
    return "bg-muted hover:bg-muted/80";
  };

  const getIndicatorIcon = () => {
    if (hasFailures && stats.downloading === 0)
      return <AlertCircle className="h-4 w-4 text-white" />;
    if (allCompleted && stats.downloading === 0)
      return <CheckCircle className="h-4 w-4 text-white" />;
    if (hasActiveDownloads) {
      return <ArrowDown className="h-4 w-4 text-white animate-bounce" />;
    }
    return <Download className="h-4 w-4 text-white" />;
  };

  const getTooltipText = () => {
    if (hasActiveDownloads) {
      return `${stats.downloading} 下载中, ${stats.completed} 已完成`;
    }
    if (hasFailures) {
      return `${stats.failed} 失败, ${stats.completed} 已完成`;
    }
    if (allCompleted) {
      return `全部 ${stats.total} 个文件已下载`;
    }
    return `${stats.total} 个下载任务`;
  };

  // 计算整体进度
  const totalProgress = (() => {
    if (tasks.length === 0) return 0;

    const totalBytes = tasks.reduce(
      (acc, task) => acc + (task.total_bytes || 0),
      0,
    );
    const downloadedBytes = tasks.reduce(
      (acc, task) => acc + task.downloaded_bytes,
      0,
    );

    if (totalBytes === 0) {
      // 如果没有总大小信息，基于完成的任务数量计算
      return (stats.completed / stats.total) * 100;
    }

    return (downloadedBytes / totalBytes) * 100;
  })();

  return (
    <div className="fixed bottom-6 right-[88px] z-40">
      <Button
        onClick={onOpenDrawer}
        className={`
          relative h-12 w-12 rounded-full shadow-lg transition-all duration-200 
          ${getIndicatorColor()}
        `}
        title={getTooltipText()}
      >
        {getIndicatorIcon()}

        {/* Progress ring for active downloads */}
        {hasActiveDownloads && (
          <svg
            className="absolute inset-0 h-12 w-12 -rotate-90"
            viewBox="0 0 48 48"
            role="img"
            aria-label="下载进度环"
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeDasharray={2 * Math.PI * 22}
              strokeDashoffset={2 * Math.PI * 22 * (1 - totalProgress / 100)}
              className="transition-all duration-300"
            />
          </svg>
        )}

        {/* Badge for count */}
        {stats.total > 0 && (
          <div className="absolute -top-2 -right-2 h-6 w-6 bg-background border-2 border-background rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">
              {stats.total > 99 ? "99+" : stats.total}
            </span>
          </div>
        )}
      </Button>
    </div>
  );
}
