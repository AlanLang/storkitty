import { Navigate, createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle,
  FolderOpen,
  LogOut,
  Mail,
  Settings,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { useAuth } from "../hooks/useAuth";

function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // 如果未登录，重定向到登录页
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">欢迎回来!</CardTitle>
                <CardDescription className="text-lg mt-2">
                  欢迎使用 Storkitty 文件管理系统
                </CardDescription>
              </div>
              <Button onClick={logout} variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                用户信息
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>用户名: {user?.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>邮箱: {user?.email}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                文件管理
              </CardTitle>
              <CardDescription>浏览和管理您的文件</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                打开文件管理器
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                文件上传
              </CardTitle>
              <CardDescription>上传新文件到服务器</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                上传文件
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                系统设置
              </CardTitle>
              <CardDescription>配置系统偏好设置</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                打开设置
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                系统状态
              </CardTitle>
              <CardDescription>当前系统运行状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span>认证状态</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">已登录</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>会话管理</span>
                  <span className="text-muted-foreground">JWT Token</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span>用户权限</span>
                  <span className="text-muted-foreground">管理员</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>文件管理</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">准备就绪</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>即将推出的功能</CardTitle>
              <CardDescription>正在开发中的新功能</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { icon: "📁", text: "文件浏览和目录管理" },
                  { icon: "⬆️", text: "文件上传（支持拖拽）" },
                  { icon: "⬇️", text: "文件下载和批量下载" },
                  { icon: "✏️", text: "文件重命名和移动" },
                  { icon: "🗑️", text: "文件删除和回收站" },
                  { icon: "🔍", text: "文件搜索和过滤" },
                ].map((feature) => (
                  <div
                    key={feature.text}
                    className="flex items-center gap-3 py-2"
                  >
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
