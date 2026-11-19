import { useFileUploadDialog } from "@/hooks/use-task";
import { cn } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { type DragEvent, type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";

/** 只响应从系统拖入的文件，忽略页面内的文本 / 链接拖拽 */
function isFileDrag(e: DragEvent) {
  return Array.from(e.dataTransfer.types).includes("Files");
}

/** 从 drop 事件中取出文件，过滤掉文件夹（webkitGetAsEntry 只能在 drop 回调里同步调用） */
function getDroppedFiles(e: DragEvent) {
  const files: File[] = [];
  let skippedFolders = 0;

  for (const item of Array.from(e.dataTransfer.items)) {
    if (item.kind !== "file") continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      skippedFolders++;
      continue;
    }
    const file = item.getAsFile();
    if (file) files.push(file);
  }

  return { files, skippedFolders };
}

export function FileDropZone({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { uploadFiles } = useFileUploadDialog();
  const [dragging, setDragging] = useState(false);
  // 拖拽经过子元素时会反复触发 enter / leave，用计数判断是否真正离开
  const dragDepth = useRef(0);

  const handleDragEnter = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current++;
    setDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    // 必须阻止默认行为，否则浏览器会直接打开文件
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLElement>) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragging(false);

    const { files, skippedFolders } = getDroppedFiles(e);
    if (skippedFolders > 0) {
      toast.warning(`暂不支持上传文件夹，已跳过 ${skippedFolders} 个文件夹`);
    }
    uploadFiles(files);
  };

  return (
    <section
      aria-label="拖放文件到此处上传"
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <UploadIcon className="h-8 w-8 text-primary" />
          </div>
          <p className="font-medium text-foreground">释放以上传到当前目录</p>
        </div>
      )}
    </section>
  );
}
