import { AlertCircle, Copy, FileText, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface CodePreviewProps {
  directoryId: string;
  filePath: string;
  fileName: string;
  fileExtension: string;
}

// 文件扩展名到 Prism.js 语言映射
const extensionToLanguage: Record<string, string> = {
  // JavaScript 系列
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
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
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",

  // Web
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",

  // 配置文件
  json: "json",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  conf: "ini",
  config: "ini",

  // 数据库
  sql: "sql",

  // 其他
  md: "markdown",
  txt: "none",
  log: "none",
  gitignore: "none",
  dockerfile: "docker",
};

// 获取语言显示名称
const getLanguageDisplayName = (language: string): string => {
  const displayNames: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    python: "Python",
    rust: "Rust",
    go: "Go",
    java: "Java",
    kotlin: "Kotlin",
    c: "C",
    cpp: "C++",
    php: "PHP",
    ruby: "Ruby",
    swift: "Swift",
    bash: "Shell",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    less: "Less",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    toml: "TOML",
    ini: "INI",
    sql: "SQL",
    markdown: "Markdown",
    docker: "Dockerfile",
    none: "Plain Text",
  };
  return displayNames[language] || language.toUpperCase();
};

export function CodePreview({
  directoryId,
  filePath,
  fileName,
  fileExtension,
}: CodePreviewProps) {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLElement>(null);

  // 确定语言类型
  const language = useMemo(() => {
    return extensionToLanguage[fileExtension] || "none";
  }, [fileExtension]);

  const languageDisplayName = useMemo(() => {
    return getLanguageDisplayName(language);
  }, [language]);

  // 判断是否需要语法高亮
  const needsSyntaxHighlighting = language !== "none";

  // 动态加载 Prism.js
  const loadPrismJS = useCallback(async () => {
    if (window.Prism) {
      return;
    }

    try {
      // 加载 Prism.js 核心库和主题
      const prismCoreScript = document.createElement("script");
      prismCoreScript.src =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js";

      const prismAutoloaderScript = document.createElement("script");
      prismAutoloaderScript.src =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/autoloader/prism-autoloader.min.js";

      const prismLineNumbersScript = document.createElement("script");
      prismLineNumbersScript.src =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.js";

      // 加载主题 CSS - 使用浅色主题
      const prismThemeLink = document.createElement("link");
      prismThemeLink.rel = "stylesheet";
      prismThemeLink.href =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism.min.css";

      const prismLineNumbersLink = document.createElement("link");
      prismLineNumbersLink.rel = "stylesheet";
      prismLineNumbersLink.href =
        "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/plugins/line-numbers/prism-line-numbers.min.css";

      document.head.appendChild(prismThemeLink);
      document.head.appendChild(prismLineNumbersLink);

      // 按顺序加载脚本
      await new Promise<void>((resolve) => {
        prismCoreScript.onload = () => resolve();
        document.head.appendChild(prismCoreScript);
      });

      await new Promise<void>((resolve) => {
        prismAutoloaderScript.onload = () => {
          // 配置 autoloader
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (window as any).Prism.plugins.autoloader.languages_path =
            "https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/";
          resolve();
        };
        document.head.appendChild(prismAutoloaderScript);
      });

      await new Promise<void>((resolve) => {
        prismLineNumbersScript.onload = () => resolve();
        document.head.appendChild(prismLineNumbersScript);
      });
    } catch (err) {
      console.error("Failed to load Prism.js:", err);
    }
  }, []);

  // 获取文件内容
  const fetchFileContent = useCallback(async () => {
    const response = await fetch(
      `/api/files/${encodeURIComponent(directoryId)}/download/${encodeURIComponent(filePath)}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  }, [directoryId, filePath]);

  // 复制代码到剪贴板
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("代码已复制到剪贴板");
    } catch (_err) {
      toast.error("复制失败");
    }
  };

  // 初始化：同时加载 Prism.js 和文件内容，全部完成后再设置内容
  useEffect(() => {
    const initializePreview = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 并行加载资源
        const promises = needsSyntaxHighlighting
          ? ([fetchFileContent(), loadPrismJS()] as const)
          : [fetchFileContent()];

        const [fileContent] = await Promise.all(promises);

        // 所有资源加载完成后设置内容
        setContent(fileContent);
      } catch (err) {
        console.error("Failed to initialize preview:", err);
        setError("无法加载文件内容，请检查文件是否存在或重试");
      } finally {
        setIsLoading(false);
      }
    };

    initializePreview();
  }, [loadPrismJS, fetchFileContent, needsSyntaxHighlighting]);

  // 当内容设置后应用语法高亮
  useEffect(() => {
    if (content && needsSyntaxHighlighting && codeRef.current && window.Prism) {
      // 设置语言类名
      codeRef.current.className = `language-${language}`;
      codeRef.current.textContent = content;

      // 应用高亮
      window.Prism.highlightElement(codeRef.current);
    }
  }, [content, language, needsSyntaxHighlighting]);

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
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex flex-col items-center text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">文件为空</h3>
        <p className="text-muted-foreground">该文件没有内容</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-row justify-between items-center py-2">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-medium">{fileName}</h3>
            <p className="text-sm text-muted-foreground">
              {languageDisplayName} • {content.split("\n").length} 行
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCode}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          复制代码
        </Button>
      </div>
      <div className="border-t border-border overflow-hidden">
        <div className="overflow-x-auto">
          <pre className="line-numbers m-0 p-4 text-sm bg-muted/30">
            <code ref={codeRef} className={`language-${language}`}>
              {content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
