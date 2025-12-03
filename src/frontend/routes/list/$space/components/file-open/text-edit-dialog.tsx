import { getFileContent, saveFileContent } from "@/api/file/content";
import { FileType } from "@/api/file/list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FileIcon } from "@/routes/list/$space/components/file-icon";
import type { OnMount } from "@monaco-editor/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Blocks,
  Copy,
  Loader2,
  Maximize,
  Minimize,
  Save,
  X,
} from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import { DIALOG_CONTENT_CLASSNAME } from "../constant";
import type { FileOpenDialogProps } from "./type";

const Editor = lazy(() => import("@monaco-editor/react"));

export function TextFileEditDialog(props: FileOpenDialogProps) {
  const { path, fileName, isOpen, onCancel, onFinish } = props;
  const filePath = `${path}/${fileName}`;
  const fileExtension = fileName.split(".").pop() || "txt";
  const editorRef = useRef<Parameters<OnMount>[0]>(null);
  const isChanged = useRef(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const theme = localStorage.getItem("theme") || "light";
  const isDark = theme === "dark";

  useHotkeys(
    "mod+s",
    () => {
      handleSave();
    },
    {
      enabled: isOpen,
      preventDefault: true,
    },
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["file-content", filePath],
    queryFn: () => getFileContent(filePath),
    enabled: isOpen,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const { mutate: saveContent, isPending: isSaving } = useMutation({
    mutationFn: async (content: string) => {
      await saveFileContent(filePath, content);
    },
    onSuccess: () => {
      isChanged.current = true;
      toast.success("保存成功");
    },
  });

  const handleSave = () => {
    saveContent(editorRef.current?.getValue() || "");
  };

  const handleFormat = () => {
    editorRef.current?.getAction("editor.action.formatDocument")?.run();
  };

  const handleClose = () => {
    if (isChanged.current) {
      onFinish();
    } else {
      onCancel();
    }
    isChanged.current = false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
        showCloseButton={false}
        className={cn(
          DIALOG_CONTENT_CLASSNAME,
          "sm:max-w-[90vw] sm:w-[90vw] sm:h-[90vh] w-full max-w-full h-full sm:rounded-lg rounded-none flex flex-col p-0 gap-0 overflow-hidden",
          isMaximized &&
            "sm:max-w-full sm:w-full sm:h-full w-full max-w-full h-full rounded-none flex flex-col p-0 gap-0 overflow-hidden shadow-none border-none sm:rounded-none",
        )}
      >
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileIcon fileInfo={{ name: fileName, fileType: FileType.File }} />
            {fileName}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize /> : <Maximize />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleFormat}
            >
              <Blocks />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <Copy />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              onClick={handleClose}
            >
              <X />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">无法加载文件内容</h3>
                <p className="text-muted-foreground max-w-sm text-sm break-all">
                  {decodeURIComponent(error.message) ||
                    "发生未知错误，请稍后重试"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onCancel}>
                  关闭
                </Button>
                <Button onClick={() => refetch()}>重试</Button>
              </div>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <Editor
                height="100%"
                defaultLanguage={getLanguage(fileExtension)}
                defaultValue={data}
                theme={isDark ? "vs-dark" : "light"}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                }}
                onMount={(editor) => {
                  editor.onKeyDown((event) => {
                    if (
                      event.keyCode === 49 &&
                      (event.metaKey || event.ctrlKey)
                    ) {
                      event.preventDefault();
                      handleSave();
                    }
                  });
                  editorRef.current = editor;
                }}
                keepCurrentModel={true}
              />
            </Suspense>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getLanguage = (ext: string) => {
  // 文件扩展名到 Monaco 语言映射
  const extensionToMonacoLanguage: Record<string, string> = {
    // JavaScript 系列
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    mjs: "javascript",
    cjs: "javascript",

    // Python
    py: "python",
    pyw: "python",

    // Rust
    rs: "rust",

    // Go
    go: "go",

    // Java/Kotlin
    java: "java",
    kt: "kotlin",
    kts: "kotlin",

    // C/C++
    c: "c",
    cpp: "cpp",
    cxx: "cpp",
    cc: "cpp",
    h: "c",
    hpp: "cpp",

    // PHP
    php: "php",

    // Ruby
    rb: "ruby",

    // Swift
    swift: "swift",

    // Shell
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    fish: "shell",

    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "scss",
    less: "less",

    // 配置文件
    json: "json",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    toml: "ini",
    ini: "ini",
    conf: "ini",
    config: "ini",

    // 数据库
    sql: "sql",

    // 其他
    md: "markdown",
    txt: "plaintext",
    log: "plaintext",
    gitignore: "plaintext",
    dockerfile: "dockerfile",
  };
  return extensionToMonacoLanguage[ext] || "plaintext";
};
