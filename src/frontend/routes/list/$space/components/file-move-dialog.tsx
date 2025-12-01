import type { FileInfo } from "@/api/file/list";
import { copyFile, moveFile } from "@/api/file/move";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useFileList } from "@/hooks/use-file-list";
import { urlJoin } from "@/lib/urlJoin";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronRight,
  Copy,
  Folder,
  Home,
  Loader2,
  SendToBack,
} from "lucide-react";
import { useEffect, useState } from "react";

interface FileMoveDialogProps {
  path: string;
  file: FileInfo | null;
  mode: "copy" | "move";
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

export function FileMoveDialog({
  path,
  file,
  mode,
  isOpen,
  onCancel,
  onFinish,
}: FileMoveDialogProps) {
  const pathParts = path.split("/");
  const initialSpace = pathParts[0];
  const [currentPath, setCurrentPath] = useState<string>(initialSpace);
  const { data, isLoading } = useFileList({ path: currentPath });

  useEffect(() => {
    if (isOpen) {
      setCurrentPath(initialSpace);
    }
  }, [isOpen, initialSpace]);

  const { mutate, isPending } = useMutation({
    mutationFn: mode === "copy" ? copyFile : moveFile,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleClose = () => {
    if (isPending) return;
    onCancel();
  };

  const handleFolderClick = (folderName: string) => {
    setCurrentPath(urlJoin(currentPath, folderName));
  };

  const handleBreadcrumbClick = (index: number) => {
    const currentPathParts = currentPath.split("/");
    const newPath = currentPathParts.slice(0, index + 1).join("/");
    setCurrentPath(newPath);
  };

  const handleConfirm = () => {
    if (!file) return;
    const fromPath = urlJoin(path, file.name);
    const toPath = currentPath;
    mutate({ from: fromPath, to: toPath });
  };

  const currentPathParts = currentPath.split("/");
  const folders = data?.files.filter((f) => f.fileType === "folder") || [];

  const Icon = mode === "copy" ? Copy : SendToBack;
  const iconColor = mode === "copy" ? "text-blue-500" : "text-orange-500";
  const iconBgColor = mode === "copy" ? "bg-blue-50" : "bg-orange-50";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                iconBgColor,
              )}
            >
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-lg font-semibold">
                {mode === "copy" ? "复制" : "移动"} {file?.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">选择目标文件夹</p>
            </div>
          </div>
        </DialogHeader>

        {/* Folder List */}
        <ScrollArea className="flex-1 min-h-[400px]">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: --只能用 index
                <div key={i} className="flex items-center gap-3 p-3 rounded">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Folder className="h-16 w-16 mb-3 opacity-20" />
              <p className="text-sm">此目录下没有文件夹</p>
            </div>
          ) : (
            <div className="p-4 space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  type="button"
                  onClick={() => handleFolderClick(folder.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Folder className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <span className="text-sm flex-1 truncate">{folder.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Breadcrumb */}
        <div className="border-t bg-muted/30 p-4">
          <div className="flex items-center space-x-1 text-sm overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPath(initialSpace)}
              className="h-7 px-2 shrink-0"
            >
              <Home className="h-4 w-4" />
            </Button>

            {currentPathParts.slice(1).map((part, index) => (
              <div key={part} className="flex items-center space-x-1 shrink-0">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index + 1)}
                  className={cn(
                    "h-7 px-2 text-sm",
                    index === currentPathParts.length - 2
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {part}
                </Button>
              </div>
            ))}

            {currentPathParts.length === 1 && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground font-medium text-sm">
                  根目录
                </span>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/10 flex-row gap-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending
              ? mode === "copy"
                ? "复制中..."
                : "移动中..."
              : mode === "copy"
                ? "复制到此处"
                : "移动到此处"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
