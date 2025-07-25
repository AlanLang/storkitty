import { createFileRoute } from "@tanstack/react-router";
import { FilesPageComponent } from "../components/FilesPageComponent";

function FilesWithPathPage() {
  const { path } = Route.useParams();

  // 解码路径参数
  const currentPath = path ? decodeURIComponent(path) : undefined;

  return <FilesPageComponent currentPath={currentPath} />;
}

export const Route = createFileRoute("/files/$path")({
  component: FilesWithPathPage,
});
