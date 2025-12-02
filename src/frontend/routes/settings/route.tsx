import { AuthRouter } from "@/components/AuthRouter";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./components/setting-sidebar";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <AuthRouter>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <main className="flex-1 overflow-auto relative">
            <SidebarTrigger className="absolute top-2 left-2" />
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </AuthRouter>
  );
}
