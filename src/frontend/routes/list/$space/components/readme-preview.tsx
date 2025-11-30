import { getFileContent } from "@/api/file/content";
import type { FileInfo } from "@/api/file/list";
import { MarkdownPreview } from "@/components/markdownPreview";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, SquarePen } from "lucide-react";

export function ReadmePreview({
  file,
  path,
  onEdit,
}: {
  file: FileInfo;
  path: string;
  onEdit: () => void;
}) {
  const filePath = `${path}/${file.name}`;
  const { data } = useQuery({
    queryKey: ["readme-content", filePath.toUpperCase()],
    queryFn: () => getFileContent(filePath),
  });
  if (!data) return null;
  return (
    <div className="border">
      <div className="px-4 py-2 flex items-center justify-between border-b bg-muted">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4" />
          <div className="text-sm font-medium">{file.name}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <SquarePen className="size-4" />
        </Button>
      </div>
      <MarkdownPreview source={data} />
    </div>
  );
}
