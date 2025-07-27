import { AlertTriangle, FolderPlus, Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateDirectoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (directoryName: string) => Promise<void>;
  isCreating: boolean;
}

export function CreateDirectoryDialog({
  isOpen,
  onClose,
  onConfirm,
  isCreating,
}: CreateDirectoryDialogProps) {
  const [directoryName, setDirectoryName] = useState("");
  const [error, setError] = useState("");

  // 验证目录名
  const validateDirectoryName = (name: string): string => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "目录名不能为空";
    }

    // 检查非法字符
    const invalidChars = /[/\\:*?"<>|]/;
    if (invalidChars.test(trimmedName)) {
      return '目录名不能包含以下字符: / \\ : * ? " < > |';
    }

    // 检查系统保留名
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
    if (reservedNames.includes(trimmedName)) {
      return "不能使用系统保留的目录名";
    }

    // 检查长度限制
    if (trimmedName.length > 255) {
      return "目录名过长，请保持在255个字符以内";
    }

    return "";
  };

  const handleConfirm = async () => {
    const trimmedName = directoryName.trim();
    const validationError = validateDirectoryName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isCreating) return;

    try {
      await onConfirm(trimmedName);
      setDirectoryName("");
      setError("");
      onClose();
    } catch (error) {
      // 错误由调用方处理
      console.error("Create directory failed:", error);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setDirectoryName("");
    setError("");
    onClose();
  };

  const handleInputChange = (value: string) => {
    setDirectoryName(value);
    if (error) {
      setError("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  const canCreate = directoryName.trim().length > 0 && !error && !isCreating;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 animate-in zoom-in-75 duration-300 delay-150">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-left">创建新文件夹</DialogTitle>
              <DialogDescription className="text-left">
                在当前位置创建一个新的文件夹
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="directory-name" className="text-sm font-medium">
              文件夹名称
            </Label>
            <Input
              id="directory-name"
              type="text"
              value={directoryName}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入文件夹名称"
              disabled={isCreating}
              className={
                error ? "border-destructive focus-visible:ring-destructive" : ""
              }
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">
              💡 提示：文件夹名称不能包含特殊字符，且不能与系统保留名冲突
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
            className="transition-all duration-200 hover:scale-105"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canCreate}
            className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderPlus className="h-4 w-4" />
            )}
            {isCreating ? "创建中..." : "创建文件夹"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
