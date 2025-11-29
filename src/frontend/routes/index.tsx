import { useApp } from "@/hooks/use-app";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  const appInfo = useApp();

  if (!appInfo.loggedIn) {
    return <Navigate to="/login" />;
  }

  return (
    <Navigate
      to="/list/$space/$"
      params={{ space: appInfo.storages?.at(0)?.path ?? "data" }}
    />
  );
}
