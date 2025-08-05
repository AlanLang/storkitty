import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (filename: string) => Promise<void>;
  currentPath?: string;
}

// 支持的文本文件扩展名
const SUPPORTED_EXTENSIONS = [
  "md",
  "txt",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rs",
  "go",
  "java",
  "kt",
  "c",
  "cpp",
  "h",
  "hpp",
  "php",
  "rb",
  "swift",
  "sh",
  "bash",
  "html",
  "htm",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "xml",
  "yaml",
  "yml",
  "toml",
  "ini",
  "conf",
  "config",
  "sql",
  "log",
  "gitignore",
  "dockerfile",
];

// 常用文件类型的默认扩展名和描述
const COMMON_FILE_TYPES = [
  { extension: "md", description: "Markdown 文档" },
  { extension: "txt", description: "纯文本文件" },
  { extension: "js", description: "JavaScript 文件" },
  { extension: "ts", description: "TypeScript 文件" },
  { extension: "py", description: "Python 脚本" },
  { extension: "rs", description: "Rust 源代码" },
  { extension: "html", description: "HTML 页面" },
  { extension: "css", description: "CSS 样式表" },
  { extension: "json", description: "JSON 数据文件" },
  { extension: "yaml", description: "YAML 配置文件" },
];

// 验证文件名
function validateFilename(filename: string): string | null {
  if (!filename.trim()) {
    return "文件名不能为空";
  }

  // 检查非法字符
  const invalidChars = ["/", "\\", ":", "*", "?", '"', "<", ">", "|"];
  const hasInvalidChar = invalidChars.some((char) => filename.includes(char));
  if (hasInvalidChar) {
    return '文件名包含非法字符: / \\ : * ? " < > |';
  }

  // 检查系统保留名称
  const reservedNames = [
    ".DS_Store",
    ".chunks",
    "Thumbs.db",
    ".gitkeep",
    "desktop.ini",
    ".tmp",
    ".temp",
    "__pycache__",
    ".git",
    ".svn",
    "node_modules",
  ];
  if (reservedNames.includes(filename)) {
    return "不能使用系统保留的文件名";
  }

  // 检查文件扩展名
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) {
    return "文件名必须包含扩展名";
  }

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return "不支持的文件类型，仅支持文本文件";
  }

  // 检查文件名长度
  if (filename.length > 255) {
    return "文件名过长，最多 255 个字符";
  }

  return null;
}

export function CreateFileDialog({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}: CreateFileDialogProps) {
  const [filename, setFilename] = useState("");
  const [selectedType, setSelectedType] = useState("md");
  const [customExtension, setCustomExtension] = useState("");
  const [useCustomExtension, setUseCustomExtension] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当对话框打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setFilename("");
      setSelectedType("md");
      setCustomExtension("");
      setUseCustomExtension(false);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 生成完整文件名
  const getFullFilename = useCallback(() => {
    const baseName = filename.replace(/\.[^/.]+$/, ""); // 移除已有的扩展名
    const extension = useCustomExtension ? customExtension : selectedType;
    return `${baseName}.${extension}`;
  }, [filename, selectedType, customExtension, useCustomExtension]);

  // 实时验证文件名
  useEffect(() => {
    if (filename) {
      const fullFilename = getFullFilename();
      const validationError = validateFilename(fullFilename);
      setError(validationError);
    } else {
      setError(null);
    }
  }, [filename, getFullFilename]);

  // 处理文件类型选择
  const handleTypeSelect = (extension: string) => {
    setSelectedType(extension);
    setUseCustomExtension(false);
    setCustomExtension("");
  };

  // 处理自定义扩展名
  const handleCustomExtension = () => {
    setUseCustomExtension(true);
    setSelectedType("");
  };

  // 处理创建文件
  const handleCreateFile = async () => {
    const fullFilename = getFullFilename();
    const validationError = validateFilename(fullFilename);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(fullFilename);
      onClose();
      toast.success("文件创建成功");
    } catch (error) {
      console.error("Failed to create file:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("创建文件失败");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !error && filename && !isSubmitting) {
      handleCreateFile();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            新建文件
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentPath && (
            <div className="text-sm text-muted-foreground">
              位置: {currentPath || "根目录"}
            </div>
          )}

          {/* 文件名输入 */}
          <div className="space-y-2">
            <Label htmlFor="filename">文件名</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
              placeholder="输入文件名（不含扩展名）"
              autoFocus
            />
          </div>

          {/* 文件类型选择 */}
          <div className="space-y-2">
            <Label>文件类型</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_FILE_TYPES.map((type) => (
                <button
                  key={type.extension}
                  type="button"
                  onClick={() => handleTypeSelect(type.extension)}
                  className={`p-2 text-left rounded border transition-colors ${
                    selectedType === type.extension && !useCustomExtension
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium text-sm">.{type.extension}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>

            {/* 自定义扩展名 */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCustomExtension}
                className={`w-full p-2 text-left rounded border transition-colors ${
                  useCustomExtension
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="font-medium text-sm">自定义扩展名</div>
                <div className="text-xs text-muted-foreground">
                  输入其他支持的文件扩展名
                </div>
              </button>

              {useCustomExtension && (
                <Input
                  value={customExtension}
                  onChange={(e) => setCustomExtension(e.target.value)}
                  placeholder="输入扩展名（如: conf, log）"
                  className="mt-2"
                />
              )}
            </div>
          </div>

          {/* 预览完整文件名 */}
          {filename && (
            <div className="p-3 bg-muted/50 rounded border">
              <div className="text-sm text-muted-foreground">
                完整文件名预览:
              </div>
              <div className="font-medium">{getFullFilename()}</div>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded border border-destructive/20">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button
              onClick={handleCreateFile}
              disabled={!filename || !!error || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  创建中...
                </>
              ) : (
                "创建文件"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
