import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export function MarkdownPreview({ source }: { source: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // @ts-expect-error
    import("https://esm.sh/marked@15.0.3")
      .then((module) => {
        const { marked } = module;
        setHtml(marked.parse(source || "") as string);
        setLoading(false);    
      })
      .catch((err) => {
        console.error("Failed to load marked", err);
        setHtml("Failed to load preview");
        setLoading(false);
      });
  }, [source]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  return (
    <div
      className="prose dark:prose-invert max-w-none p-4"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}