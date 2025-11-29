import { deleteFile } from "@/api/file/delete";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize } from "@/lib/file";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { FileIcon, Loader2, Trash2 } from "lucide-react";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface FileDeleteDialogProps {
  path: string;
  name: string;
  isOpen: boolean;
  size?: number;
  onCancel: () => void;
  onFinish: () => void;
}

export function FileDeleteDialog({
  path,
  name,
  size,
  isOpen,
  onCancel,
  onFinish,
}: FileDeleteDialogProps) {
  const { mutate, isPending } = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleClose = () => {
    if (isPending) return;
    onCancel();
  };

  const handleConfirm = async () => {
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
              删除文件
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
              您确定要永久删除此文件吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 text-left">
              <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                <FileIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {size ? formatFileSize(size) : "未知大小"}
                </p>
              </div>
            </div>
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
            disabled={isPending}
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
