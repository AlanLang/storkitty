import { createFileRoute } from "@tanstack/react-router";
import { FilesPageComponent } from "../components/FilesPageComponent";

function FilesIndexPage() {
  // 根目录：currentPath为undefined
  return <FilesPageComponent currentPath={undefined} />;
}

export const Route = createFileRoute("/files/")({
  component: FilesIndexPage,
});
