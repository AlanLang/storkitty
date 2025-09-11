import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  file: FileInfo | null;
  isDeleting: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  file,
  isDeleting,
}: DeleteConfirmDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");

  if (!file) return null;

  const isFolder = file.file_type === "folder";
  const itemCount = file.items || 0;

  // 要求用户输入文件名确认删除（特别是对于文件夹）
  const requiresConfirmation = isFolder && itemCount > 0;
  const confirmationText = file.name;
  const canDelete = !requiresConfirmation || confirmInput === confirmationText;

  const handleConfirm = async () => {
    if (!canDelete || isDeleting) return;

    try {
      await onConfirm();
      setConfirmInput("");
      onClose();
    } catch (error) {
      // 错误由调用方处理
      console.error("Delete failed:", error);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmInput("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive animate-heartbeat" />
            </div>
            <div>
              <DialogTitle className="text-left">
                删除{isFolder ? "文件夹" : "文件"}
              </DialogTitle>
              <DialogDescription className="text-left">
                此操作无法撤销
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 overflow-x-hidden">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                {isFolder ? (
                  <div className="h-4 w-4 rounded bg-primary/20" />
                ) : (
                  <div className="h-4 w-4 rounded bg-muted-foreground/20" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isFolder
                    ? `包含 ${itemCount} 个项目`
                    : file.size
                      ? `${(file.size / 1024).toFixed(1)} KB`
                      : "未知大小"}
                </p>
              </div>
            </div>
          </div>

          {isFolder && itemCount > 0 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ 警告：此文件夹不为空
                </p>
                <p className="text-sm text-destructive/80 mt-1">
                  {`删除此文件夹将同时删除其中的所有 ${itemCount} 个项目，且无法恢复。`}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-input"
                  className="text-sm font-medium block"
                >
                  请输入文件夹名称 "
                  <span className="text-destructive">{confirmationText}</span>"
                  以确认删除：
                </label>
                <input
                  id="confirm-input"
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder="输入文件夹名称"
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  disabled={isDeleting}
                />
              </div>
            </div>
          )}

          {!isFolder && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">
                确定要删除文件 "{file.name}" 吗？此操作无法撤销。
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
            className="transition-all duration-200 hover:scale-105"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className="gap-2 transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
