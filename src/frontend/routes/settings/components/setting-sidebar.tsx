"use client";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeSwitch } from "@/components/ui/theme-switch-button";
import { useApp } from "@/hooks/use-app";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, HardDrive, User } from "lucide-react";
import type * as React from "react";
const settingsNav = [
  {
    title: "用户设置",
    href: "/settings/user",
    icon: User,
  },
  // Add more settings items here in the future
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();

  const appInfo = useApp();
  const version = appInfo.version;

  return (
    <Sidebar collapsible="offcanvas" className="z-0" {...props}>
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

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {settingsNav.map((item) => {
                const isActive = !!matchRoute({ to: item.href, fuzzy: true });

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      onClick={() => navigate({ to: item.href })}
                      isActive={isActive}
                      className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 relative overflow-hidden group
                     border-2 border-primary/20 hover:border-primary/40
                     bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5
                     hover:from-primary/10 hover:via-primary/20 hover:to-primary/10
                     transition-all duration-300 ease-out
                     hover:shadow-lg hover:shadow-primary/20
                     font-medium text-base"
          onClick={() => navigate({ to: "/" })}
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] 
                          transition-transform duration-700 ease-out"
          />
          <ChevronLeft
            className="h-5 w-5 transition-transform duration-300 
                                  group-hover:-translate-x-1 group-hover:scale-110
                                  relative z-10"
          />
          <span className="relative z-10 group-hover:translate-x-0.5 transition-transform duration-300">
            返回主页
          </span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
