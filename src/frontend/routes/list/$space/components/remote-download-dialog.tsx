import { createRemoteDownload } from "@/api/remote-download";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTaskDrawer } from "@/hooks/use-task";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { CloudDownload, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface RemoteDownloadDialogProps {
  path: string;
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

export function RemoteDownloadDialog({
  path,
  isOpen,
  onCancel,
  onFinish,
}: RemoteDownloadDialogProps) {
  const [urls, setUrls] = useState("");
  const { setOpen: setTaskDrawerOpen } = useTaskDrawer();

  useEffect(() => {
    if (isOpen) {
      setUrls("");
    }
  }, [isOpen]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (urls: string[]) => {
      await createRemoteDownload(path, urls);
    },
    onSuccess: () => {
      onFinish();
      setTaskDrawerOpen("remote-download");
    },
  });

  const handleClose = () => {
    if (isPending) return;
    onCancel();
  };

  const handleConfirm = async () => {
    if (!urls.trim()) {
      return;
    }
    const urlList = urls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u);
    mutate(urlList);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(DIALOG_CONTENT_CLASSNAME, "sm:max-w-[600px]")}
      >
        <div className="p-6 flex flex-col items-center text-center space-y-4 pt-8 min-w-0">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
            <CloudDownload className="h-8 w-8 text-primary" />
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-center">
              离线下载
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
              请输入下载链接，每行一个
            </DialogDescription>
          </DialogHeader>

          <div className="w-full mt-4">
            <Textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder="https://example.com/file.zip"
              className="min-h-[150px]"
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
            disabled={isPending || !urls.trim()}
            className="w-full sm:w-1/2 gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "提交中..." : "下载"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
