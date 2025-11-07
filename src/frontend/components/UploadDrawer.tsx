import { useRouter } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  File as FileIcon,
  Folder,
  Play,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatETA, formatUploadSpeed } from "../api/chunkedUpload";
import { formatFileSize } from "../api/upload";
import type { UploadItem } from "../contexts/UploadContextDefinition";
import { useAuth } from "../hooks/useAuth";
import { useUpload } from "../hooks/useUploadContext";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface UploadDrawerProps {
  targetPath?: string;
}

export function UploadDrawer({ targetPath }: UploadDrawerProps = {}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get file configuration from auth context
  const { fileConfig } = useAuth();

  const {
    uploadItems,
    isUploading,
    globalError,
    isDrawerOpen,
    setIsDrawerOpen,
    addFiles,
    removeFile,
    cancelUpload,
    startUpload,
    clearCompleted,
    clearAll,
    getUploadStats,
  } = useUpload();

  // Handle drawer animations
  useEffect(() => {
    if (isDrawerOpen) {
      setIsVisible(true);
      // Force a layout reflow before starting animation
      const timer = setTimeout(() => {
        setIsAnimating(true);
      }, 10); // Small delay to ensure DOM is ready
      return () => clearTimeout(timer);
    }
    if (isVisible) {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen, isVisible]);

  // Detect current path from router if targetPath is not provided
  const getCurrentPath = () => {
    if (targetPath) return targetPath;

    const location = router.state.location;
    if (location.pathname.startsWith("/files/")) {
      const pathSegment = location.pathname.replace("/files/", "");
      return pathSegment ? decodeURIComponent(pathSegment) : undefined;
    }
    return undefined;
  };

  const currentPath = getCurrentPath();

  // Handle drawer close
  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // File list refresh is now handled automatically by UploadContext
  }, [setIsDrawerOpen]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addFiles(acceptedFiles, currentPath, fileConfig?.max_file_size_mb);
    },
    [addFiles, currentPath, fileConfig?.max_file_size_mb],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxFiles: 20,
    disabled: false, // Always allow adding files even during upload
  });

  const handleStartUpload = () => {
    startUpload(currentPath, currentPath);
  };

  const stats = getUploadStats();
  const hasValidFiles = stats.pending > 0;
  const hasCompletedFiles = stats.completed > 0;
  const hasActiveUploads = stats.uploading > 0;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          isAnimating ? "bg-black/20 backdrop-blur-sm" : "bg-black/0"
        }`}
        onClick={handleCloseDrawer}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            handleCloseDrawer();
          }
        }}
        role="button"
        tabIndex={0}
      />

      {/* Drawer */}
      <div
        className={`absolute top-0 right-0 w-[28rem] h-full bg-background border-l shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold">上传文件</h2>
              {currentPath && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Folder className="h-3 w-3" />
                  <span>目标: /{currentPath}</span>
                </div>
              )}
            </div>
            {stats.total > 0 && (
              <span className="text-sm text-muted-foreground">
                ({stats.total})
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCloseDrawer}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Global Error */}
        {globalError && (
          <div className="p-4 border-b">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Drop Zone */}
        <div className="p-4 border-b">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-primary font-medium text-sm">
                拖放文件到这里...
              </p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-1">
                  拖拽文件到这里或点击选择文件
                </p>
                <p className="text-xs text-muted-foreground">
                  支持单个文件最大{fileConfig?.max_file_size_mb || 100}MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        {uploadItems.length > 0 && (
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm">
                <span className="font-medium">文件: {stats.total}</span>
                {stats.uploading > 0 && (
                  <span className="text-blue-600 ml-2">
                    • {stats.uploading} 上传中
                  </span>
                )}
                {stats.completed > 0 && (
                  <span className="text-green-600 ml-2">
                    • {stats.completed} 已完成
                  </span>
                )}
                {stats.error > 0 && (
                  <span className="text-red-600 ml-2">
                    • {stats.error} 失败
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={hasActiveUploads}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                清空
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStartUpload}
                disabled={!hasValidFiles || isUploading}
                size="sm"
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {isUploading ? "上传中..." : `上传 ${stats.pending} 个文件`}
              </Button>

              {hasCompletedFiles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  清除完成
                </Button>
              )}
            </div>
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto">
          {uploadItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Upload className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">未选择文件</h3>
              <p className="text-sm text-muted-foreground">
                拖拽文件到上方区域开始上传
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {uploadItems.map((item) => (
                <UploadItemCard
                  key={item.id}
                  item={item}
                  onRemove={() => removeFile(item.id)}
                  onCancel={() => cancelUpload(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer Status */}
        {(isUploading || hasActiveUploads) && (
          <div className="p-4 border-t bg-blue-50 dark:bg-blue-950/50">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                上传进行中... 您可以安全地关闭此抽屉。
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface UploadItemCardProps {
  item: UploadItem;
  onRemove: () => void;
  onCancel: () => void;
}

function UploadItemCard({ item, onRemove, onCancel }: UploadItemCardProps) {
  const getStatusIcon = () => {
    switch (item.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "cancelled":
        return <X className="h-4 w-4 text-orange-500" />;
      case "uploading":
        return (
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <FileIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {getStatusIcon()}

        <div className="flex-1 min-w-0">
          {/* File info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium truncate">{item.file.name}</p>
            </div>
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {formatFileSize(item.file.size)}
            </span>
          </div>

          {/* Error message */}
          {item.error && (
            <p className="text-xs text-red-500 mb-2">{item.error}</p>
          )}

          {/* Cancelled message */}
          {item.status === "cancelled" && (
            <p className="text-xs text-orange-500 mb-2">上传已取消</p>
          )}

          {/* Upload progress */}
          {item.status === "uploading" && (
            <div className="space-y-2">
              {/* Progress info */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>上传中...</span>

                <div className="flex items-center gap-2">
                  {item.uploadProgress?.speed && (
                    <span>{formatUploadSpeed(item.uploadProgress.speed)}</span>
                  )}
                  {item.uploadProgress?.eta && (
                    <span>预计: {formatETA(item.uploadProgress.eta)}</span>
                  )}
                  <span>{Math.round(item.progress)}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 bg-primary"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {item.status === "uploading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-6 w-6 p-0"
              title="取消上传"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          {item.status !== "uploading" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
              title="移除文件"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
