import { CheckCircle, Clipboard, Copy, Move, X } from "lucide-react";
import type { ClipboardItem } from "../types/files";
import { Button } from "./ui/button";

interface ClipboardIndicatorProps {
  item: ClipboardItem;
  canPaste: boolean;
  isPasting: boolean;
  onPaste: () => void;
  onClear: () => void;
  showAnimation?: boolean;
}

export function ClipboardIndicator({
  item,
  canPaste,
  isPasting,
  onPaste,
  onClear,
  showAnimation = false,
}: ClipboardIndicatorProps) {
  // 获取操作图标和文本
  const OperationIcon = item.operation === "move" ? Move : Copy;
  const operationText = item.operation === "move" ? "移动" : "复制";

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 min-w-[280px] ${
          showAnimation ? "animate-in slide-in-from-bottom-4 duration-300" : ""
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clipboard className="h-4 w-4 text-muted-foreground" />
            <span>剪贴板</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* 文件信息 */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded border">
          <OperationIcon className="h-4 w-4 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {operationText} ·
              {item.file.file_type === "folder" ? "文件夹" : "文件"}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {canPaste ? (
            <Button
              onClick={onPaste}
              disabled={isPasting}
              className="flex-1 gap-2"
              variant="default"
            >
              {isPasting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  粘贴中...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  粘贴到此处
                </>
              )}
            </Button>
          ) : (
            <div className="flex-1 p-2 text-center text-sm text-muted-foreground bg-muted/30 rounded border border-dashed">
              不能跨目录{operationText}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="px-3"
          >
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}
