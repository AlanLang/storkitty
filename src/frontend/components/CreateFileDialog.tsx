import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string) => Promise<void>;
  currentPath?: string;
}

// 验证文件名
function validateFilename(filename: string): string | null {
  if (!filename.trim()) {
    return "文件名不能为空";
  }

  // 检查非法字符
  const invalidChars = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
  const hasInvalidChar = invalidChars.some((char) => filename.includes(char));
  if (hasInvalidChar) {
    return '文件名包含非法字符: / \\ : * ? " < > |';
  }

  // 检查系统保留名称
  const reservedNames = [
    ".DS_Store",
    ".chunks",
    "Thumbs.db",
    ".gitkeep",
    "desktop.ini",
    ".tmp",
    ".temp",
    "__pycache__",
    ".git",
    ".svn",
    "node_modules",
  ];
  if (reservedNames.includes(filename)) {
    return "不能使用系统保留的文件名";
  }

  // 检查文件名长度
  if (filename.length > 255) {
    return "文件名过长，最多 255 个字符";
  }

  return null;
}

export function CreateFileDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}: CreateFileDialogProps) {
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当对话框打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setFilename("");
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 实时验证文件名
  useEffect(() => {
    if (filename) {
      const validationError = validateFilename(filename);
      setError(validationError);
    } else {
      setError(null);
    }
  }, [filename]);

  // 处理创建文件
  const handleCreateFile = async () => {
    const validationError = validateFilename(filename);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(filename);
      onClose();
      toast.success("文件创建成功");
    } catch (error) {
      console.error("Failed to create file:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("创建文件失败");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !error && filename && !isSubmitting) {
      handleCreateFile();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            新建文件
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentPath && (
            <div className="text-sm text-muted-foreground">
              位置: {currentPath || "根目录"}
            </div>
          )}

          {/* 文件名输入 */}
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
              placeholder="输入完整文件名（如: a.demo, README.md）"
              autoFocus
            />
          </div>

          {/* 错误信息 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button
              onClick={handleCreateFile}
              disabled={!filename || !!error || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  创建中...
                </>
              ) : (
                "创建文件"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
