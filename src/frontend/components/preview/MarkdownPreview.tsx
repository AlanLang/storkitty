import { AlertCircle, Loader2 } from "lucide-react";
import { useShowFileQuery } from "../../hooks/useFiles";
import { MarkdownRenderer } from "../MarkdownRenderer";
import {} from "../ui/card";

interface MarkdownPreviewProps {
  directoryId: string;
  filePath: string;
}

export function MarkdownPreview({
  directoryId,
  filePath,
}: MarkdownPreviewProps) {
  // 查询文件内容（Markdown 文件，无需认证）
  const {
    data: fileData,
    isLoading,
    error,
  } = useShowFileQuery(directoryId, filePath, true);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">加载文件内容中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground">
          无法加载文件内容，请检查文件是否存在或重试
        </p>
      </div>
    );
  }

  if (fileData?.success && fileData.content) {
    return (
      <div className="max-w-4xl mx-auto">
        <MarkdownRenderer content={fileData.content} />
      </div>
    );
  }

  if (fileData && !fileData.success) {
    return (
      <div className="flex flex-col items-center text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">无法预览文件</h3>
        <p className="text-muted-foreground">
          {fileData.message || "文件内容无法显示"}
        </p>
      </div>
    );
  }

  return null;
}
