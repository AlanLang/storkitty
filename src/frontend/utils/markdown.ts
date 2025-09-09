// 动态加载 markdown-it 库的工具函数
// 使用 CDN 加载，避免增加打包体积

interface MarkdownIt {
  render(markdown: string): string;
}

interface MarkdownItConstructor {
  new (options?: {
    html?: boolean;
    breaks?: boolean;
    linkify?: boolean;
  }): MarkdownIt;
}

// 缓存已加载的实例
let markdownItInstance: MarkdownIt | null = null;
let loadingPromise: Promise<MarkdownIt> | null = null;

/**
 * 动态加载 markdown-it 库并返回实例
 */
export async function loadMarkdownIt(): Promise<MarkdownIt> {
  // 如果已经有实例，直接返回
  if (markdownItInstance) {
    return markdownItInstance;
  }

  // 如果正在加载，等待加载完成
  if (loadingPromise) {
    return loadingPromise;
  }

  // 开始加载
  loadingPromise = new Promise<MarkdownIt>((resolve, reject) => {
    try {
      // 检查是否已经存在全局 markdownit
      const globalMarkdownIt = (window as unknown as Record<string, unknown>)
        .markdownit;
      if (globalMarkdownIt) {
        const instance = new (globalMarkdownIt as MarkdownItConstructor)({
          html: true,
          breaks: true,
          linkify: true,
        });
        markdownItInstance = instance;
        resolve(instance);
        return;
      }

      // 动态加载 markdown-it
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/markdown-it@14.0.0/dist/markdown-it.min.js";
      script.crossOrigin = "anonymous";

      script.onload = () => {
        try {
          const MarkdownItConstructor = (
            window as unknown as Record<string, unknown>
          ).markdownit as MarkdownItConstructor;

          if (!MarkdownItConstructor) {
            reject(new Error("Failed to load markdown-it library"));
            return;
          }

          const instance = new MarkdownItConstructor({
            html: true, // 允许 HTML 标签
            breaks: true, // 换行符转换为 <br>
            linkify: true, // 自动转换链接
          });

          markdownItInstance = instance;
          resolve(instance);
        } catch (error) {
          reject(error);
        }
      };

      script.onerror = () => {
        reject(new Error("Failed to load markdown-it from CDN"));
      };

      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return loadingPromise;
}

/**
 * 渲染 markdown 内容为 HTML
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  try {
    const markdownIt = await loadMarkdownIt();
    return markdownIt.render(markdown);
  } catch (error) {
    console.error("Failed to render markdown:", error);
    // 降级：返回纯文本格式
    return `<pre>${markdown}</pre>`;
  }
}

/**
 * 检查是否支持动态加载（用于服务端渲染兼容性）
 */
export function isMarkdownSupported(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}
