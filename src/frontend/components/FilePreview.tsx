import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Code,
  Download,
  Edit,
  File,
  FileText,
  Image,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import {
  canCopyToClipboard,
  copyDownloadLink,
  downloadFile,
} from "../utils/download";
import { isEditable } from "../utils/editor";
import {
  CodePreview,
  ImagePreview,
  MarkdownPreview,
  PDFPreview,
  TextEditor,
  UnsupportedFilePreview,
} from "./preview";
import { Button } from "./ui/button";

interface FilePreviewProps {
  directoryId: string;
  filePath: string;
  startInEditMode?: boolean;
}

export function FilePreview({ directoryId, filePath, startInEditMode = false }: FilePreviewProps) {
  const navigate = useNavigate();
  const { isAuthenticated, directories } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);

  // 获取目录信息（如果已登录）
  const directoryInfo = directories?.find((dir) => dir.id === directoryId);

  // 解析文件信息
  const fileInfo = useMemo(() => {
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];
    const parentPath = pathParts.slice(0, -1).join("/");
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";

    // 支持的图片格式
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    const isImage = imageExtensions.includes(fileExtension);

    // 支持的文本/代码文件格式
    const textExtensions = [
      // JavaScript 系列
      "js",
      "jsx",
      "ts",
      "tsx",
      "mjs",
      "cjs",
      // Python
      "py",
      "pyw",
      // Rust
      "rs",
      // Go
      "go",
      // Java/Kotlin
      "java",
      "kt",
      "kts",
      // C/C++
      "c",
      "cpp",
      "cxx",
      "cc",
      "h",
      "hpp",
      // PHP
      "php",
      // Ruby
      "rb",
      // Swift
      "swift",
      // Shell
      "sh",
      "bash",
      "zsh",
      "fish",
      // Web
      "html",
      "htm",
      "css",
      "scss",
      "sass",
      "less",
      // 配置文件
      "json",
      "xml",
      "yaml",
      "yml",
      "toml",
      "ini",
      "conf",
      "config",
      // 数据库
      "sql",
      // 其他
      "txt",
      "log",
      "gitignore",
      "dockerfile",
    ];
    const isTextFile = textExtensions.includes(fileExtension);

    const isPDF = fileExtension === "pdf";
    const canEdit = isEditable(fileExtension);

    return {
      name: fileName,
      extension: fileExtension,
      parentPath,
      isMarkdown: fileExtension === "md",
      isImage,
      isTextFile,
      isPDF,
      canEdit,
      isPreviewable: fileExtension === "md" || isImage || isTextFile || isPDF,
    };
  }, [filePath]);

  // 处理初始编辑模式
  useEffect(() => {
    if (startInEditMode && isAuthenticated && fileInfo.canEdit) {
      setIsEditMode(true);
    }
  }, [startInEditMode, isAuthenticated, fileInfo.canEdit]);

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

  // 切换编辑模式
  const handleToggleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  // 退出编辑模式
  const handleExitEdit = () => {
    setIsEditMode(false);
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
                  ) : fileInfo.isImage ? (
                    <Image className="h-4 w-4 text-green-600" />
                  ) : fileInfo.isTextFile ? (
                    <Code className="h-4 w-4 text-orange-600" />
                  ) : fileInfo.isPDF ? (
                    <FileText className="h-4 w-4 text-red-600" />
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

              {/* 编辑功能：仅登录用户且可编辑文件可见 */}
              {isAuthenticated && fileInfo.canEdit && (
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleEdit}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  {isEditMode ? "退出编辑" : "编辑"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6">
        {isEditMode && fileInfo.canEdit ? (
          <TextEditor
            directoryId={directoryId}
            filePath={filePath}
            fileName={fileInfo.name}
            fileExtension={fileInfo.extension}
            onExitEdit={handleExitEdit}
          />
        ) : fileInfo.isMarkdown ? (
          <MarkdownPreview directoryId={directoryId} filePath={filePath} />
        ) : fileInfo.isImage ? (
          <ImagePreview
            directoryId={directoryId}
            filePath={filePath}
            fileName={fileInfo.name}
            fileExtension={fileInfo.extension}
          />
        ) : fileInfo.isTextFile ? (
          <CodePreview
            directoryId={directoryId}
            filePath={filePath}
            fileName={fileInfo.name}
            fileExtension={fileInfo.extension}
          />
        ) : fileInfo.isPDF ? (
          <PDFPreview directoryId={directoryId} filePath={filePath} />
        ) : (
          <UnsupportedFilePreview
            directoryId={directoryId}
            filePath={filePath}
            fileName={fileInfo.name}
            fileExtension={fileInfo.extension}
          />
        )}
      </div>
    </div>
  );
}
