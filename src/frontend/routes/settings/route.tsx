import { AuthRouter } from "@/components/AuthRouter";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
} from "@tanstack/react-router";
import { ChevronLeft, User } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

const settingsNav = [
  {
    title: "用户设置",
    href: "/settings/user",
    icon: User,
  },
  // Add more settings items here in the future
];

function SettingsLayout() {
  const navigate = useNavigate();

  return (
    <AuthRouter>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-muted/10 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6">
            <h2 className="text-lg font-semibold">设置</h2>
            <p className="text-sm text-muted-foreground mt-1">
              管理您的账户和偏好设置
            </p>
          </div>

          <Separator />

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-1">
            {settingsNav.map((item) => (
              <Link key={item.href} to={item.href} className="block">
                {({ isActive }) => (
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive && "hover:bg-muted",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </div>
                )}
              </Link>
            ))}
          </nav>

          <Separator />

          {/* Back to Home */}
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => navigate({ to: "/" })}
            >
              <ChevronLeft className="h-4 w-4" />
              返回主页
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AuthRouter>
  );
}
