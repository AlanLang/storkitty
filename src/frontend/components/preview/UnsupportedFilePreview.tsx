import { Download, Edit, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import {
  canCopyToClipboard,
  copyDownloadLink,
  downloadFile,
} from "../../utils/download";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader } from "../ui/card";
import { TextEditor } from "./TextEditor";

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
  const { isAuthenticated } = useAuth();
  const [forceTextPreview, setForceTextPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

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

  // 处理强制文本预览
  const handleForceTextPreview = async () => {
    if (previewContent !== null) {
      // 如果已经有内容，直接显示
      setForceTextPreview(true);
      return;
    }

    try {
      setIsLoadingPreview(true);
      const response = await fetch(
        `/api/files/${encodeURIComponent(directoryId)}/download/${encodeURIComponent(filePath)}`,
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      setPreviewContent(text);
      setForceTextPreview(true);
    } catch (error) {
      console.error("Failed to fetch file content:", error);
      toast.error("文件加载失败");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // 处理切换编辑模式
  const handleToggleEdit = async () => {
    if (!forceTextPreview || previewContent === null) {
      // 如果还没有预览或没有内容，先加载内容
      await handleForceTextPreview();
    }
    setIsEditMode(!isEditMode);
  };

  // 处理退出编辑模式
  const handleExitEdit = () => {
    setIsEditMode(false);
  };

  // 处理保存成功后的内容更新
  const handleSaveSuccess = (newContent: string) => {
    setPreviewContent(newContent);
  };

  // 如果开启了强制文本预览，显示文本预览或编辑器
  if (forceTextPreview) {
    if (isEditMode && isAuthenticated) {
      return (
        <TextEditor
          directoryId={directoryId}
          filePath={filePath}
          fileExtension={fileExtension}
          onExitEdit={handleExitEdit}
          onSaveSuccess={handleSaveSuccess}
          forceEditable={true}
          preloadedContent={previewContent || ""}
        />
      );
    }

    return (
      <div className="max-w-full mx-auto">
        {/* 强制文本预览工具栏 */}
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-4 mb-4 sticky top-20 z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-primary">强制文本预览</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  .{fileExtension} 文件
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAuthenticated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  编辑
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setForceTextPreview(false)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                返回原始预览
              </Button>
            </div>
          </div>
        </div>

        {/* 文本预览内容 */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-lg">
          <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
            {previewContent}
          </pre>
        </div>
      </div>
    );
  }

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
            当前支持预览 Markdown 文件、图片文件和代码/文本文件。
            <br />
            该文件类型
            <span className="font-mono text-sm bg-muted px-1 rounded">
              .{fileExtension}
            </span>
            暂不支持在线预览。
          </p>

          <div className="flex flex-col gap-4">
            {/* 主要操作 */}
            <div className="space-y-3">
              <Button
                onClick={handleForceTextPreview}
                disabled={isLoadingPreview}
                className="w-full gap-2"
              >
                {isLoadingPreview ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    加载中...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" />
                    强制文本预览
                  </>
                )}
              </Button>
            </div>

            {/* 下载操作 */}
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleDownload}
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                下载文件
              </Button>

              {canCopyToClipboard() && (
                <Button
                  variant="outline"
                  onClick={handleCopyDownloadLink}
                  className="w-full gap-2"
                >
                  复制下载链接
                </Button>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-medium mb-3">已支持的文件类型</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-green-600 mb-4">
              <div>• Markdown 文件 (.md)</div>
              <div>• 图片文件 (.jpg, .png, .gif, .webp)</div>
              <div>• 代码文件 (.js, .ts, .py, .rs, .go)</div>
              <div>• 文本文件 (.txt, .log, .json, .xml)</div>
              <div>• PDF 文档 (.pdf)</div>
            </div>

            <h3 className="font-medium mb-3">强制文本预览</h3>
            <div className="text-sm text-muted-foreground mb-4">
              <p>
                点击"强制文本预览"可以将任何文件强制以文本方式预览，适用于配置文件、日志文件等文本内容。
                {isAuthenticated && (
                  <span className="block mt-1 text-blue-600">
                    登录用户还可以直接编辑文件内容。
                  </span>
                )}
              </p>
            </div>

            <h3 className="font-medium mb-3">即将支持的文件类型</h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div>• 视频文件 (.mp4, .webm)</div>
              <div>• 音频文件 (.mp3, .wav)</div>
              <div>• 表格文件 (.csv, .xlsx)</div>
              <div>• 压缩文件 (.zip, .tar)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
