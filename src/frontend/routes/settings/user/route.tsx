import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createFileRoute,
  Outlet,
  useMatchRoute,
  useNavigate,
} from "@tanstack/react-router";
import { Shield, User } from "lucide-react";

export const Route = createFileRoute("/settings/user")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const tab = matchRoute({ to: "/settings/user/profile" })
    ? "profile"
    : "security";

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">用户设置</h1>
        <p className="text-muted-foreground mt-2">
          管理您的个人资料和账户安全设置
        </p>
      </div>

      <Tabs value={tab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger
            value="profile"
            className="gap-2"
            onClick={() => navigate({ to: "/settings/user/profile" })}
          >
            <User className="h-4 w-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-2"
            onClick={() => navigate({ to: "/settings/user/security" })}
          >
            <Shield className="h-4 w-4" />
            密码和安全
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Outlet />
        </TabsContent>

        <TabsContent value="security">
          <Outlet />
        </TabsContent>
      </Tabs>
    </div>
  );
}
