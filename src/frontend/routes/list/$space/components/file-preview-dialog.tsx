import { FileType, type FileInfo } from "@/api/file/list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  CloudDownload,
  FileQuestion,
  Loader2,
  Maximize,
  Minimize,
  SquareArrowOutUpRight,
  SquarePen,
  X,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { downloadFile } from "../utils/downloadFile";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";
import { FileIcon } from "./file-icon";

/** 这些类型的文件自带脚本，放进同源 iframe 会拿到登录态，用 sandbox 隔离 */
const SANDBOXED_EXTENSIONS = /\.(html?|xhtml|svg)$/i;

export function createPreviewUrl(path: string, fileName: string) {
  const segments = [...path.split("/"), fileName]
    .filter(Boolean)
    .map(encodeURIComponent);
  return `/open/${segments.join("/")}`;
}

interface FilePreviewDialogProps {
  path: string;
  file: FileInfo | null;
  isOpen: boolean;
  onCancel: () => void;
  onEdit: (file: FileInfo) => void;
}

export function FilePreviewDialog({
  path,
  file,
  isOpen,
  onCancel,
  onEdit,
}: FilePreviewDialogProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [frameLoaded, setFrameLoaded] = useState(false);

  const fileName = file?.name ?? "";
  const openUrl = createPreviewUrl(path, fileName);
  // 后端对预览内容设置了长缓存，带上修改时间，文件变更后不会看到旧内容
  const frameUrl = `${openUrl}?v=${encodeURIComponent(file?.modified ?? "")}`;

  // 先用 HEAD 探测后端能否预览该文件（不支持的类型会返回错误），再决定是否加载 iframe
  const { data: previewable, isLoading } = useQuery({
    queryKey: ["file-preview", frameUrl],
    queryFn: async () => {
      const res = await fetch(frameUrl, { method: "HEAD" });
      return res.ok;
    },
    enabled: isOpen && !!file,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFrameLoaded(false);
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        // 默认会聚焦第一个按钮，导致"编辑"的 tooltip 一打开就弹出来
        onOpenAutoFocus={(e) => e.preventDefault()}
        className={cn(
          DIALOG_CONTENT_CLASSNAME,
          "sm:max-w-[90vw] sm:w-[90vw] sm:h-[90vh] w-full max-w-full h-full sm:rounded-lg rounded-none flex flex-col p-0 gap-0 overflow-hidden",
          isMaximized &&
            "sm:max-w-full sm:w-full sm:h-full shadow-none border-none sm:rounded-none",
        )}
      >
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between gap-2 space-y-0">
          <DialogTitle className="flex items-center gap-2 min-w-0">
            <FileIcon fileInfo={{ name: fileName, fileType: FileType.File }} />
            <span className="truncate">{fileName}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">文件预览</DialogDescription>
          <div className="flex items-center gap-1 shrink-0">
            <HeaderButton
              label="编辑"
              onClick={() => file && onEdit(file)}
              disabled={!file}
            >
              <SquarePen />
            </HeaderButton>
            <HeaderButton
              label="在新标签页打开"
              onClick={() => window.open(openUrl, "_blank")}
            >
              <SquareArrowOutUpRight />
            </HeaderButton>
            <HeaderButton
              label="下载"
              onClick={() => downloadFile(path, fileName)}
            >
              <CloudDownload />
            </HeaderButton>
            <HeaderButton
              label={isMaximized ? "还原" : "最大化"}
              className="hidden sm:inline-flex"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize /> : <Maximize />}
            </HeaderButton>
            <HeaderButton label="关闭" onClick={() => handleOpenChange(false)}>
              <X />
            </HeaderButton>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative bg-muted/30">
          {previewable && (
            <iframe
              key={frameUrl}
              src={frameUrl}
              title={fileName}
              className="absolute inset-0 w-full h-full border-0 bg-background"
              onLoad={() => setFrameLoaded(true)}
              {...(SANDBOXED_EXTENSIONS.test(fileName)
                ? { sandbox: "allow-scripts allow-popups allow-modals" }
                : {})}
            />
          )}

          {(isLoading || (previewable && !frameLoaded)) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && previewable === false && file && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">暂不支持预览该文件</h3>
                <p className="text-muted-foreground text-sm">
                  可以下载到本地查看，或者尝试直接编辑
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(file)}>
                  <SquarePen />
                  编辑
                </Button>
                <Button onClick={() => downloadFile(path, fileName)}>
                  <CloudDownload />
                  下载
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HeaderButton({
  label,
  className,
  children,
  ...props
}: {
  label: string;
  className?: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className={cn(
            "h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            className,
          )}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
