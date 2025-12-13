import type { AppInfo } from "@/api/app";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { ThemeSwitch } from "@/components/ui/theme-switch-button";
import { useApp } from "@/hooks/use-app";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Folder, HardDrive, Star } from "lucide-react";
import { NavUser } from "./nav-user";

export function FileListSidebar({ space }: { space?: string }) {
  const appInfo = useApp();
  const navigate = useNavigate();
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
        <FavoriteSidebar favorites={appInfo.favorites} />
        <SidebarGroupLabel>存储目录</SidebarGroupLabel>
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

function FavoriteSidebar({ favorites }: { favorites: AppInfo["favorites"] }) {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const isSelected = matchRoute({ to: "/list", fuzzy: false });
  if (!favorites) return null;

  return (
    <Button
      variant={isSelected ? "default" : "ghost"}
      className="w-full justify-start gap-2"
      onClick={() =>
        navigate({
          to: "/list",
        })
      }
      title="个人收藏"
    >
      <Star className="h-4 w-4" />
      个人收藏
    </Button>
  );
}
