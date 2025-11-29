import { deleteFolder } from "@/api/folder/delete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface FolderDeleteDialogProps {
  path: string;
  name: string;
  isOpen: boolean;
  count: number;
  onCancel: () => void;
  onFinish: () => void;
}

export function FolderDeleteDialog({
  path,
  name,
  isOpen,
  count,
  onCancel,
  onFinish,
}: FolderDeleteDialogProps) {
  const [confirmInput, setConfirmInput] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleClose = () => {
    if (isPending) return;
    onCancel();
    setConfirmInput("");
  };

  const canDelete = count > 0 ? confirmInput === name : true;

  const handleConfirm = async () => {
    if (!canDelete) return;
    mutate({ path, name });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(DIALOG_CONTENT_CLASSNAME)}>
        <div className="p-6 flex flex-col items-center text-center space-y-4 pt-8 min-w-0">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
            <Trash2 className="h-8 w-8 text-red-500" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-center">
              删除文件夹
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground max-w-[300px] mx-auto">
              {count > 0
                ? "此文件夹包含多个项目，删除后无法恢复。"
                : "您确定要永久删除此空文件夹吗？"}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-4 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 text-left">
              <div className="h-10 w-10 rounded-md bg-yellow-50 flex items-center justify-center shrink-0">
                <FolderOpen className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground">
                  包含 {count} 个项目
                </p>
              </div>
            </div>

            {count > 0 && (
              <div className="space-y-3 text-left animate-in slide-in-from-bottom-2 fade-in duration-300">
                <div className="rounded-md bg-red-50 border border-red-100 p-3 flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="text-sm text-red-600">
                    <p className="font-medium">警告：非空文件夹</p>
                    <p className="text-xs mt-1 opacity-90">
                      所有内容将被永久删除且无法恢复。
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-input"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    请输入{" "}
                    <span className="text-foreground font-bold select-all">
                      {name}
                    </span>{" "}
                    以确认
                  </Label>
                  <Input
                    id="confirm-input"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    placeholder="输入文件夹名称"
                    className="h-9 text-sm"
                    disabled={isPending}
                    autoComplete="off"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/10 flex-col sm:flex-row gap-2 sm:gap-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="w-full sm:w-1/2"
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canDelete || isPending}
            className="w-full sm:w-1/2 gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isPending ? "删除中..." : "确认删除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
