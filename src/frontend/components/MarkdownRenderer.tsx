import { useEffect, useState } from "react";
import { isMarkdownSupported, renderMarkdown } from "../utils/markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  const [renderedContent, setRenderedContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content) {
      setIsLoading(false);
      return;
    }

    if (!isMarkdownSupported()) {
      // 服务端渲染或不支持的环境，显示纯文本
      setRenderedContent(`<pre>${content}</pre>`);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const renderContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const html = await renderMarkdown(content);

        if (isMounted) {
          setRenderedContent(html);
        }
      } catch (err) {
        console.error("Failed to render markdown:", err);
        if (isMounted) {
          setError("Failed to render markdown content");
          // 降级显示纯文本
          setRenderedContent(`<pre>${content}</pre>`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    renderContent();

    return () => {
      isMounted = false;
    };
  }, [content]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce" />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-100" />
        <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-200" />
        <span className="ml-2">Loading README...</span>
      </div>
    );
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div
      className="prose prose-gray dark:prose-invert max-w-none p-4"
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
