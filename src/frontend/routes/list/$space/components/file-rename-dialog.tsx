import { renameFile } from "@/api/file/rename";
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
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { FilePen, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface FileRenameDialogProps {
  path: string;
  name: string;
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

export function FileRenameDialog({
  path,
  name,
  isOpen,
  onCancel,
  onFinish,
}: FileRenameDialogProps) {
  const [newName, setNewName] = useState(name);

  useEffect(() => {
    if (isOpen) {
      setNewName(name);
    }
  }, [isOpen, name]);

  const { mutate, isPending } = useMutation({
    mutationFn: renameFile,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleClose = () => {
    if (isPending) return;
    onCancel();
  };

  const handleConfirm = async () => {
    if (!newName || newName === name) {
      return;
    }
    mutate({ path, from: name, to: newName });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(DIALOG_CONTENT_CLASSNAME)}>
        <div className="p-6 flex flex-col items-center text-center space-y-4 pt-8 min-w-0">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
            <FilePen className="h-8 w-8 text-primary" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-center">
              重命名文件
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
              请输入新的文件名称
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="请输入名称"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
            />
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
            onClick={handleConfirm}
            disabled={isPending || !newName || newName === name}
            className="w-full sm:w-1/2 gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "重命名中..." : "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
