import { Download, Plus, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { toast } from "sonner";
import { extractFilename, isValidUrl } from "../api/download";
import { useAuth } from "../hooks/useAuth";
import { useDirectoryContext } from "../hooks/useDirectoryContext";
import { useCreateDownloadTasksMutation } from "../hooks/useDownload";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";

interface DownloadDialogProps {
  currentPath?: string;
}

export function DownloadDialog({ currentPath = "" }: DownloadDialogProps) {
  const [open, setOpen] = useState(false);
  const [urls, setUrls] = useState("");
  const { token } = useAuth();
  const { selectedDirectoryId } = useDirectoryContext();

  // 使用 mutation hook
  const createTasksMutation = useCreateDownloadTasksMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token || !selectedDirectoryId) {
      toast.error("请先登录");
      return;
    }

    const urlList = urls
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlList.length === 0) {
      toast.error("请至少输入一个下载链接");
      return;
    }

    // 验证所有URL
    const invalidUrls = urlList.filter((url) => !isValidUrl(url));
    if (invalidUrls.length > 0) {
      toast.error(`以下链接格式无效：${invalidUrls.join(", ")}`);
      return;
    }

    // 使用 mutation 创建下载任务
    createTasksMutation.mutate(
      {
        request: {
          urls: urlList,
          directory_id: selectedDirectoryId,
          target_path: currentPath,
        },
        token,
      },
      {
        onSuccess: () => {
          setUrls("");
          setOpen(false);
        },
      },
    );
  };

  const handleUrlsChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setUrls(e.target.value);
  };

  // 获取URL列表以显示预览
  const urlList = urls
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          远程下载
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            远程下载文件
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL输入区域 */}
          <div className="space-y-2">
            <Label htmlFor="urls">下载链接 (每行一个)</Label>
            <textarea
              id="urls"
              value={urls}
              onChange={handleUrlsChange}
              placeholder="请输入下载链接，每行一个&#10;例如：&#10;https://example.com/file1.zip&#10;https://example.com/file2.pdf"
              className="w-full h-32 px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={createTasksMutation.isPending}
            />
            <p className="text-sm text-muted-foreground">
              支持HTTP/HTTPS链接，每行输入一个下载链接
            </p>
          </div>

          {/* 下载预览 */}
          {urlList.length > 0 && (
            <div className="space-y-2">
              <Label>下载预览 ({urlList.length} 个任务)</Label>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {urlList.map((url) => {
                  const isValid = isValidUrl(url);
                  const filename = isValid ? extractFilename(url) : "无效链接";

                  return (
                    <div
                      key={url}
                      className={`flex items-center justify-between p-2 text-sm border-b last:border-b-0 ${
                        isValid ? "bg-background" : "bg-destructive/10"
                      }`}
                    >
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-medium truncate">{filename}</div>
                        <div
                          className={`text-xs break-all ${
                            isValid
                              ? "text-muted-foreground"
                              : "text-destructive"
                          }`}
                          style={{
                            wordBreak: "break-all",
                            overflowWrap: "break-word",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {url}
                        </div>
                      </div>
                      {!isValid && (
                        <X className="h-4 w-4 text-destructive ml-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 目标位置信息 */}
          <div className="p-3 bg-muted rounded-md text-sm">
            <div className="font-medium mb-1">下载位置</div>
            <div className="text-muted-foreground">
              目录: {selectedDirectoryId}
              {currentPath && (
                <>
                  <br />
                  路径: /{currentPath}
                </>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createTasksMutation.isPending}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={createTasksMutation.isPending || urlList.length === 0}
              className="gap-2"
            >
              {createTasksMutation.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  创建任务...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  创建 {urlList.length} 个下载任务
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
