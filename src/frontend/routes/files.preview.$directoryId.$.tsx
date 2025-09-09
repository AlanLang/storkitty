import { createFileRoute } from "@tanstack/react-router";
import { FilePreview } from "../components/FilePreview";

export const Route = createFileRoute("/files/preview/$directoryId/$")({
  component: FilePreviewPage,
});

function FilePreviewPage() {
  const { directoryId, _splat } = Route.useParams();

  // 检查 URL 搜索参数是否包含 edit=true
  const search = Route.useSearch() as Record<string, unknown>;
  const startInEditMode = search?.edit === true || search?.edit === "true";

  // 移除认证检查，允许未登录用户预览文件
  return (
    <FilePreview
      directoryId={directoryId}
      filePath={_splat ?? ""}
      startInEditMode={startInEditMode}
    />
  );
}
