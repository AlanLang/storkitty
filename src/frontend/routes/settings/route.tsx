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
          <main className="flex-1 overflow-auto bg-sidebar flex flex-col">
            <div className="p-2">
              <SidebarTrigger className="" />
            </div>
            <div className="bg-background flex-1 rounded-l-lg">
              <Outlet />
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthRouter>
  );
}
