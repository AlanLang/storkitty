import { AlertTriangle, Edit, Loader2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import type { FileInfo } from "../types/files";
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

interface RenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
  file: FileInfo | null;
  isRenaming: boolean;
}

export function RenameDialog({
  isOpen,
  onClose,
  onConfirm,
  file,
  isRenaming,
}: RenameDialogProps) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  // 当文件变化时，设置初始名称
  useEffect(() => {
    if (file && isOpen) {
      setNewName(file.name);
      setError("");
    }
  }, [file, isOpen]);

  // 验证文件名
  const validateFileName = (name: string): string => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return "文件名不能为空";
    }

    // 检查非法字符
    const invalidChars = /[/\\:*?"<>|]/;
    if (invalidChars.test(trimmedName)) {
      return '文件名不能包含以下字符: / \\ : * ? " < > |';
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
      return "不能使用系统保留的文件名";
    }

    // 检查长度限制
    if (trimmedName.length > 255) {
      return "文件名过长，请保持在255个字符以内";
    }

    // 检查是否与原名称相同
    if (file && trimmedName === file.name) {
      return "新名称不能与原名称相同";
    }

    return "";
  };

  const handleConfirm = async () => {
    const trimmedName = newName.trim();
    const validationError = validateFileName(trimmedName);

    if (validationError) {
      setError(validationError);
      return;
    }

    if (isRenaming) return;

    try {
      await onConfirm(trimmedName);
      setNewName("");
      setError("");
      onClose();
    } catch (error: unknown) {
      // 显示后端返回的错误信息
      const errorMessage =
        error instanceof Error ? error.message : "重命名失败，请重试";
      setError(errorMessage);
      console.error("Rename failed:", error);
    }
  };

  const handleClose = () => {
    if (isRenaming) return;
    setNewName("");
    setError("");
    onClose();
  };

  const handleInputChange = (value: string) => {
    setNewName(value);
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

  const canRename =
    newName.trim().length > 0 &&
    !error &&
    !isRenaming &&
    file &&
    newName.trim() !== file.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Edit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-left">
                重命名{file?.file_type === "folder" ? "文件夹" : "文件"}
              </DialogTitle>
              <DialogDescription className="text-left">
                为 "{file?.name}" 输入新的名称
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-name" className="text-sm font-medium">
              新名称
            </Label>
            <Input
              id="new-name"
              type="text"
              value={newName}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入新的名称"
              disabled={isRenaming}
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
              💡 提示：文件名不能包含特殊字符，且不能与系统保留名冲突
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isRenaming}
            className="transition-all duration-200 hover:scale-105"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canRename}
            className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            {isRenaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
            {isRenaming ? "重命名中..." : "重命名"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
