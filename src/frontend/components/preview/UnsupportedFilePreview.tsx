import { Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  canCopyToClipboard,
  copyDownloadLink,
  downloadFile,
} from "../../utils/download";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";

interface UnsupportedFilePreviewProps {
  directoryId: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
}

export function UnsupportedFilePreview({
  directoryId,
  filePath,
  fileName,
  fileExtension,
}: UnsupportedFilePreviewProps) {
  // 处理下载
  const handleDownload = () => {
    downloadFile(filePath, fileName, directoryId);
  };

  // 处理复制下载链接
  const handleCopyDownloadLink = async () => {
    const success = await copyDownloadLink(filePath, directoryId);
    if (success) {
      toast.success("下载链接已复制到剪贴板");
    } else {
      toast.error("复制下载链接失败");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 mx-auto flex items-center justify-center rounded-full bg-muted mb-4">
            <Eye className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">暂不支持预览</h2>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-6">
            当前支持预览 Markdown (.md) 文件和图片文件 (.jpg, .png, .gif 等)。
            <br />
            该文件类型
            <span className="font-mono text-sm bg-muted px-1 rounded">
              .{fileExtension}
            </span>
            暂不支持在线预览。
          </p>

          <div className="space-y-3">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              下载文件
            </Button>

            {canCopyToClipboard() && (
              <div>
                <Button
                  variant="outline"
                  onClick={handleCopyDownloadLink}
                  className="gap-2"
                >
                  复制下载链接
                </Button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-medium mb-3">已支持的文件类型</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-600 mb-4">
              <div>• Markdown 文件 (.md)</div>
              <div>• 图片文件 (.jpg, .png, .gif, .webp)</div>
            </div>

            <h3 className="font-medium mb-3">即将支持的文件类型</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• 文本文件 (.txt, .log)</div>
              <div>• PDF 文档 (.pdf)</div>
              <div>• 代码文件 (.js, .ts, .py, .rs)</div>
              <div>• 视频文件 (.mp4, .webm)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
