import { createFileRoute } from "@tanstack/react-router";
import { FilePreview } from "../components/FilePreview";

export const Route = createFileRoute("/files/preview/$directoryId/$")({
  component: FilePreviewPage,
});

function FilePreviewPage() {
  const { directoryId, _splat } = Route.useParams();

  // 移除认证检查，允许未登录用户预览文件
  return <FilePreview directoryId={directoryId} filePath={_splat} />;
}
