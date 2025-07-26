import { AlertCircle, CheckCircle, Upload } from "lucide-react";
import { useUpload } from "../hooks/useUploadContext";
import { Button } from "./ui/button";

export function UploadIndicator() {
  const { uploadItems, getUploadStats, setIsDrawerOpen } = useUpload();

  const stats = getUploadStats();

  // Don't show indicator if no uploads
  if (stats.total === 0) return null;

  // Don't show if drawer is open
  // if (isDrawerOpen) return null;

  const hasActiveUploads = stats.uploading > 0;
  const hasErrors = stats.error > 0;
  const allCompleted = stats.completed === stats.total && stats.total > 0;

  const getIndicatorColor = () => {
    if (hasErrors) return "bg-red-500 hover:bg-red-600";
    if (hasActiveUploads) return "bg-blue-500 hover:bg-blue-600 animate-pulse";
    if (allCompleted) return "bg-green-500 hover:bg-green-600";
    return "bg-muted hover:bg-muted/80";
  };

  const getIndicatorIcon = () => {
    if (hasErrors) return <AlertCircle className="h-4 w-4 text-white" />;
    if (allCompleted) return <CheckCircle className="h-4 w-4 text-white" />;
    return <Upload className="h-4 w-4 text-white" />;
  };

  const getTooltipText = () => {
    if (hasActiveUploads) {
      return `${stats.uploading} 上传中, ${stats.completed} 已完成`;
    }
    if (hasErrors) {
      return `${stats.error} 失败, ${stats.completed} 已完成`;
    }
    if (allCompleted) {
      return `全部 ${stats.total} 个文件已上传`;
    }
    return `${stats.total} 个文件待上传`;
  };

  // Calculate overall progress
  const totalProgress =
    uploadItems.reduce((acc, item) => acc + item.progress, 0) /
    Math.max(uploadItems.length, 1);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={() => setIsDrawerOpen(true)}
        className={`
          relative h-12 w-12 rounded-full shadow-lg transition-all duration-200 
          ${getIndicatorColor()}
        `}
        title={getTooltipText()}
      >
        {getIndicatorIcon()}

        {/* Progress ring for active uploads */}
        {hasActiveUploads && (
          <svg
            className="absolute inset-0 h-12 w-12 -rotate-90"
            viewBox="0 0 48 48"
            role="img"
            aria-label="上传进度环"
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
