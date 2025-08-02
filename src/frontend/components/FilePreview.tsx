import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Download,
  Eye,
  File,
  FileText,
  Loader2,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useShowFileQuery } from "../hooks/useFiles";
import {
  canCopyToClipboard,
  copyDownloadLink,
  downloadFile,
} from "../utils/download";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";

interface FilePreviewProps {
  directoryId: string;
  filePath: string;
}

export function FilePreview({ directoryId, filePath }: FilePreviewProps) {
  const navigate = useNavigate();
  const { isAuthenticated, directories } = useAuth();

  // 获取目录信息（如果已登录）
  const directoryInfo = directories?.find((dir) => dir.id === directoryId);

  // 解析文件信息
  const fileInfo = useMemo(() => {
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join("/");
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    return {
      name: fileName,
      extension: fileExtension,
      parentPath,
      isMarkdown: fileExtension === "md",
    };
  }, [filePath]);

  // 查询文件内容（Markdown 文件，无需认证）
  const {
    data: fileData,
    isLoading,
    error,
  } = useShowFileQuery(
    directoryId,
    filePath,
    fileInfo.isMarkdown, // 移除认证检查
  );

  // 处理返回（仅登录用户可用）
  const handleGoBack = () => {
    if (fileInfo.parentPath) {
      navigate({
        to: "/files/$",
        params: { _splat: fileInfo.parentPath },
      });
    } else {
      navigate({ to: "/files" });
    }
  };

  // 处理下载
  const handleDownload = () => {
    downloadFile(filePath, fileInfo.name, directoryId);
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
    <div className="min-h-screen bg-background">
      {/* 顶部工具栏 */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGoBack}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回
                </Button>
              )}

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded bg-muted">
                  {fileInfo.isMarkdown ? (
                    <FileText className="h-4 w-4 text-primary" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold">{fileInfo.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {directoryInfo?.name || directoryId}
                    {fileInfo.parentPath && ` / ${fileInfo.parentPath}`}
                    {!isAuthenticated && (
                      <span className="ml-2 px-2 py-1 text-xs bg-muted rounded">
                        公开预览
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                下载
              </Button>

              {canCopyToClipboard() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyDownloadLink}
                  className="gap-2"
                >
                  复制链接
                </Button>
              )}

              {/* 未来编辑功能：仅登录用户可见 */}
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="gap-2 opacity-50"
                  title="编辑功能即将推出"
                >
                  编辑
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6">
        {fileInfo.isMarkdown ? (
          // Markdown 文件预览
          <>
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                <span className="text-muted-foreground">加载文件内容中...</span>
              </div>
            )}

            {error && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-medium mb-2">加载失败</h3>
                    <p className="text-muted-foreground">
                      无法加载文件内容，请检查文件是否存在或重试
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {fileData?.success && fileData.content && (
              <div className="max-w-4xl mx-auto">
                <MarkdownRenderer
                  content={fileData.content}
                  className="border-0 shadow-none"
                />
              </div>
            )}

            {fileData && !fileData.success && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="text-lg font-medium mb-2">无法预览文件</h3>
                    <p className="text-muted-foreground">
                      {fileData.message || "文件内容无法显示"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          // 不支持的文件类型
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
                  当前仅支持预览 Markdown (.md) 文件。
                  <br />
                  该文件类型
                  <span className="font-mono text-sm bg-muted px-1 rounded">
                    .{fileInfo.extension}
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
                  <h3 className="font-medium mb-3">即将支持的文件类型</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>• 图片文件 (jpg, png, gif)</div>
                    <div>• 文本文件 (txt, log)</div>
                    <div>• PDF 文档</div>
                    <div>• 代码文件 (js, ts, py, rs)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
