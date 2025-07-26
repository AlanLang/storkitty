import { createFileRoute } from "@tanstack/react-router";
import { FilesPageComponent } from "../components/FilesPageComponent";

function FilesWithPathPage() {
  const { _splat } = Route.useParams();

  return <FilesPageComponent currentPath={_splat} />;
}

export const Route = createFileRoute("/files/$")({
  component: FilesWithPathPage,
});
