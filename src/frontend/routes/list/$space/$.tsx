import { FilesPageComponent } from "@/components/FilesPageComponent";
import { useAuth } from "@/hooks/useAuth";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/list/$space/$")({
  component: RouteComponent,
});

function RouteComponent() {
  const { space, _splat } = Route.useParams();
  const { directories } = useAuth();
  if (!directories) {
    return null;
  }

  const hasSpace = directories.some((directory) => directory.id === space);

  if (!hasSpace) {
    return <div>Space not found</div>;
  }

  return <FilesPageComponent currentPath={_splat} space={space} />;
}
