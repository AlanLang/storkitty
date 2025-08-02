import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import {} from "../ui/card";

interface ImagePreviewProps {
  directoryId: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
}

export function ImagePreview({
  directoryId,
  filePath,
  fileName,
  fileExtension,
}: ImagePreviewProps) {
  // 生成图片预览URL（使用下载端点，支持公开访问）
  const imageUrl = useMemo(() => {
    return `/api/files/${encodeURIComponent(directoryId)}/download/${encodeURIComponent(filePath)}`;
  }, [directoryId, filePath]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center">
        <div className="mb-6">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-[70vh] mx-auto rounded-lg shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <div className="hidden">
            <div className="flex flex-col items-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">图片加载失败</h3>
              <p className="text-muted-foreground">
                无法加载图片，请检查文件是否存在或重试
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{fileName}</p>
          <p>格式：{fileExtension.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}
