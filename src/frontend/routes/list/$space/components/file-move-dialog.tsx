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
import { Input } from "@/components/ui/input";
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
  Search,
  SendToBack,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

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
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useFileList({ path: currentPath });

  useEffect(() => {
    if (isOpen) {
      setCurrentPath(initialSpace);
      setSearchQuery("");
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
    setSearchQuery("");
  };

  const handleBreadcrumbClick = (index: number) => {
    const currentPathParts = currentPath.split("/");
    const newPath = currentPathParts.slice(0, index + 1).join("/");
    setCurrentPath(newPath);
    setSearchQuery("");
  };

  const handleConfirm = () => {
    if (!file) return;
    const fromPath = urlJoin(path, file.name);
    const toPath = currentPath;
    mutate({ from: fromPath, to: toPath });
  };

  const currentPathParts = currentPath.split("/");
  const folders = useMemo(() => {
    const allFolders = data?.files.filter((f) => f.fileType === "folder") || [];
    if (!searchQuery) return allFolders;
    return allFolders.filter((f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [data?.files, searchQuery]);

  const Icon = mode === "copy" ? Copy : SendToBack;
  const iconColor = mode === "copy" ? "text-blue-500" : "text-orange-500";
  const iconBgColor = mode === "copy" ? "bg-blue-50" : "bg-orange-50";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          DIALOG_CONTENT_CLASSNAME,
          "sm:max-w-[600px] h-[80vh] flex flex-col p-0",
        )}
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                iconBgColor,
              )}
            >
              <Icon className={cn("h-6 w-6", iconColor)} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-xl font-bold">
                {mode === "copy" ? "复制" : "移动"} {file?.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                选择目标文件夹并确认
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Search and Navigation Bar */}
        <div className="px-6 pb-4 space-y-3 shrink-0 border-b">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <Input
              placeholder="搜索文件夹..."
              className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 text-sm bg-muted/30 p-1.5 rounded-lg overflow-x-auto no-scrollbar">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentPath(initialSpace);
                setSearchQuery("");
              }}
              className="h-7 px-2 shrink-0 hover:bg-background shadow-none"
            >
              <Home className="h-4 w-4" />
            </Button>

            {currentPathParts.slice(1).map((part, index) => (
              <div
                key={`${part}-${index}`}
                className="flex items-center gap-1 shrink-0"
              >
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index + 1)}
                  className={cn(
                    "h-7 px-2 text-sm hover:bg-background shadow-none",
                    index === currentPathParts.length - 2
                      ? "text-foreground font-semibold bg-background"
                      : "text-muted-foreground",
                  )}
                >
                  {part}
                </Button>
              </div>
            ))}

            {currentPathParts.length === 1 && (
              <div className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-foreground font-semibold text-sm px-2">
                  根目录
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Folder List Content */}
        <ScrollArea className="flex-1 min-h-0 bg-muted/5">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="flex items-center gap-3 p-3"
                >
                  <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[40%]" />
                  </div>
                </div>
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground animate-in fade-in zoom-in-95 duration-300">
              <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Folder className="h-10 w-10 opacity-40" />
              </div>
              <p className="text-sm font-medium">
                {searchQuery ? "未找到相关文件夹" : "此目录下没有文件夹"}
              </p>
              {searchQuery && (
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => setSearchQuery("")}
                >
                  清除搜索内容
                </Button>
              )}
            </div>
          ) : (
            <div className="p-4 grid gap-1">
              {folders.map((folder) => (
                <button
                  key={folder.name}
                  type="button"
                  onClick={() => handleFolderClick(folder.name)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-background hover:shadow-sm border border-transparent hover:border-border transition-all text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Folder className="h-5.5 w-5.5 text-blue-500/80 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-sm font-medium flex-1 truncate">
                    {folder.name}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-6 bg-background border-t mt-auto shrink-0 flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="flex-1 h-11 rounded-xl font-medium"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending}
            className={cn(
              "flex-1 h-11 rounded-xl font-medium gap-2 shadow-lg transition-all active:scale-[0.98]",
              mode === "copy"
                ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                : "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
            )}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
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
