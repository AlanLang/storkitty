/**
 * 动态编辑器加载工具
 * 支持 Monaco Editor 的动态加载和语言支持
 */

export interface MonacoEditor {
  editor: {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    create: (container: HTMLElement, options: unknown) => any;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    IStandaloneCodeEditor: any;
  };
}

// Monaco Editor 类型声明
declare global {
  interface Window {
    monaco?: MonacoEditor;
    MonacoEnvironment?: {
      getWorkerUrl: (moduleId: string, label: string) => string;
    };
  }
}

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

// 获取 Monaco 语言
export function getMonacoLanguage(fileExtension: string): string {
  return extensionToMonacoLanguage[fileExtension.toLowerCase()] || "plaintext";
}

// 检查编辑器是否支持某种文件类型
export function isEditable(fileExtension: string): boolean {
  const editableExtensions = Object.keys(extensionToMonacoLanguage);
  return editableExtensions.includes(fileExtension.toLowerCase());
}

// 动态加载 Monaco Editor
export async function loadMonacoEditor(): Promise<MonacoEditor> {
  // 如果已经加载，直接返回
  if (window.monaco) {
    return window.monaco;
  }

  try {
    // 设置 Monaco 环境
    window.MonacoEnvironment = {
      getWorkerUrl: (_moduleId: string, label: string) => {
        if (label === "json") {
          return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/json/json.worker.js";
        }
        if (label === "css" || label === "scss" || label === "less") {
          return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/css/css.worker.js";
        }
        if (label === "html" || label === "handlebars" || label === "razor") {
          return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/html/html.worker.js";
        }
        if (label === "typescript" || label === "javascript") {
          return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/language/typescript/ts.worker.js";
        }
        return "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.worker.js";
      },
    };

    // 动态加载 Monaco Editor
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
    document.head.appendChild(script);

    await new Promise<void>((resolve, reject) => {
      script.onload = () => {
        // biome-ignore lint/suspicious/noExplicitAny: Monaco Editor global types
        const require = (window as any).require;
        require.config({
          paths: {
            vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
          },
        });
        require(["vs/editor/editor.main"], () => {
          resolve();
        }, reject);
      };
      script.onerror = reject;
    });

    // Monaco Editor 现在应该在全局可用
    // biome-ignore lint/suspicious/noExplicitAny: Monaco Editor global types
    const monaco = (window as any).monaco;

    // 将 monaco 挂载到 window 对象
    window.monaco = monaco;

    return monaco;
  } catch (error) {
    console.error("Failed to load Monaco Editor:", error);
    throw new Error("无法加载代码编辑器");
  }
}

// 编辑器主题配置
export const editorThemes = {
  light: "vs",
  dark: "vs-dark",
  highContrast: "hc-black",
} as const;

// 默认编辑器选项
export const defaultEditorOptions = {
  automaticLayout: true,
  fontSize: 14,
  lineNumbers: "on" as const,
  minimap: { enabled: true },
  scrollBeyondLastLine: false,
  wordWrap: "on" as const,
  theme: editorThemes.light,
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  renderWhitespace: "selection" as const,
  contextmenu: true,
  mouseWheelZoom: true,
  smoothScrolling: true,
  cursorBlinking: "blink" as const,
  cursorSmoothCaretAnimation: "on" as const,
  suggest: {
    showKeywords: true,
    showSnippets: true,
  },
  acceptSuggestionOnCommitCharacter: true,
  acceptSuggestionOnEnter: "on" as const,
  accessibilitySupport: "auto" as const,
};

// 创建编辑器实例
export async function createEditor(
  container: HTMLElement,
  content: string,
  language: string,
  options: Partial<typeof defaultEditorOptions> = {},
): Promise<MonacoEditor["editor"]["IStandaloneCodeEditor"]> {
  const monaco = await loadMonacoEditor();

  const editor = monaco.editor.create(container, {
    value: content,
    language,
    ...defaultEditorOptions,
    ...options,
  });

  return editor;
}

// 获取编辑器支持的语言列表
export function getSupportedLanguages(): string[] {
  return Object.keys(extensionToMonacoLanguage);
}

// 获取语言的显示名称
export function getLanguageDisplayName(language: string): string {
  const displayNames: Record<string, string> = {
    javascript: "JavaScript",
    typescript: "TypeScript",
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
    shell: "Shell",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    less: "Less",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    ini: "INI",
    sql: "SQL",
    markdown: "Markdown",
    dockerfile: "Dockerfile",
    plaintext: "Plain Text",
  };
  return (
    displayNames[language] ||
    language.charAt(0).toUpperCase() + language.slice(1)
  );
}
