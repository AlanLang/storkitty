import { createFileRoute } from "@tanstack/react-router";
import { FilePreview } from "../components/FilePreview";
import { useAuth } from "../hooks/useAuth";

export const Route = createFileRoute("/files/preview/$directoryId/$path")({
  component: FilePreviewPage,
});

function FilePreviewPage() {
  const { directoryId, path } = Route.useParams();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // Will be handled by auth redirect
  }

  return <FilePreview directoryId={directoryId} filePath={path} />;
}
