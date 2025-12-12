import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeSwitch } from "@/components/ui/theme-switch-button";
import { useApp } from "@/hooks/use-app";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Folder, HardDrive } from "lucide-react";
import { NavUser } from "./nav-user";

export function FileListSidebar() {
  const appInfo = useApp();
  const navigate = useNavigate();
  const { space } = useParams({ from: "/list/$space/$" });
  const version = appInfo.version;

  return (
    <Sidebar collapsible="offcanvas" className="z-0">
      <div className="flex items-center justify-between border-b p-4 h-18">
        <div className="flex items-center space-x-2">
          <HardDrive className="h-6 w-6 text-primary" />
          <h1 data-testid="app-title" className="text-xl font-semibold">
            Storkitty
          </h1>
          {version && (
            <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted/60 rounded border border-border/50 translate-y-0.5">
              v{version}
            </span>
          )}
        </div>
        <ThemeSwitch className="translate-y-0.5" />
      </div>

      <SidebarContent className="space-y-2 p-4 gap-0">
        <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
          存储目录
        </div>
        {appInfo.storages?.map((storage) => {
          const isSelected = space === storage.path;

          return (
            <Button
              key={storage.name}
              variant={isSelected ? "default" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() =>
                navigate({
                  to: "/list/$space/$",
                  params: { space: storage.path },
                })
              }
              title={storage.name}
            >
              {storage.icon ? (
                <span className="text-lg pt-0.5">{storage.icon}</span>
              ) : (
                <Folder className="h-4 w-4" />
              )}
              {storage.name}
            </Button>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t">
        {appInfo.user && <NavUser user={appInfo.user} />}
      </SidebarFooter>
    </Sidebar>
  );
}
