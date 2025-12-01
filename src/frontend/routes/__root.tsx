import { Button } from "@/components/ui/button";
import { useIsWaitingAppInfo } from "@/hooks/use-app";
import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Home, Search } from "lucide-react";

export const Route = createRootRoute({
  component: () => {
    return <RootRouteComponent />;
  },
  notFoundComponent: NotFound,
});

function RootRouteComponent() {
  const isWaitingAppInfo = useIsWaitingAppInfo();

  if (isWaitingAppInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <div>正在检查系统状态...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col h-screen">
      <Outlet />
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="text-center px-6 py-12 max-w-2xl">
        {/* 404 Number with Animation */}
        <div className="mb-8 relative">
          <h1 className="text-9xl font-bold text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-24 w-24 text-muted-foreground/40 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold mb-4 text-foreground">页面未找到</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
          抱歉，您访问的页面不存在或已被移除。请检查 URL
          是否正确，或返回首页继续浏览。
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            onClick={() => navigate({ to: "/" })}
            className="gap-2 min-w-[160px]"
          >
            <Home className="h-5 w-5" />
            返回首页
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2 min-w-[160px]"
          >
            <ArrowLeft className="h-5 w-5" />
            返回上一页
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-border/40">
          <p className="text-sm text-muted-foreground">
            如果您认为这是一个错误，请联系系统管理员
          </p>
        </div>
      </div>
    </div>
  );
}
