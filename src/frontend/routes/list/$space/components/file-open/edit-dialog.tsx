import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileQuestion, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "../constant";
import { fileExtensions } from "../file-icon";
import { TextFileEditDialog } from "./text-edit-dialog";
import type { FileOpenDialogProps } from "./type";

export function EditDialog(props: FileOpenDialogProps) {
  const { fileName, isOpen, onCancel } = props;
  const [forceEdit, setForceEdit] = useState(false);

  const isText =
    fileExtensions.text.some((extension) => fileName.endsWith(extension)) ||
    fileExtensions.code.some((extension) => fileName.endsWith(extension));

  useEffect(() => {
    if (!isOpen) {
      setForceEdit(false);
    }
  }, [isOpen]);

  if (isText || forceEdit) {
    return <TextFileEditDialog {...props} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className={cn(DIALOG_CONTENT_CLASSNAME)}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex flex-col items-center text-center space-y-4 pt-8 min-w-0">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
              <FileQuestion className="h-8 w-8 text-muted-foreground" />
            </div>

            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl font-semibold text-center">
                无法识别的文件类型
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
                该文件类型 ({fileName.split(".").pop()})
                可能不是文本文件，强制编辑可能会导致乱码或文件损坏。
              </DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="p-6 bg-muted/10 flex-col sm:flex-row gap-2 sm:gap-2 border-t mt-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-1/2"
            >
              取消
            </Button>
            <Button
              onClick={() => setForceEdit(true)}
              className="w-full sm:w-1/2 gap-2"
            >
              <FileText className="h-4 w-4" />
              强制文本编辑
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
