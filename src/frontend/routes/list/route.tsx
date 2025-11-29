import { AuthRouter } from "@/components/AuthRouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/list")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AuthRouter>
      <SidebarProvider>
        <Outlet />
      </SidebarProvider>
    </AuthRouter>
  );
}
