import { useQuery } from "@tanstack/react-query";
import { Navigate, createFileRoute } from "@tanstack/react-router";
import { setupApi } from "../api/auth";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // 检查是否需要初始化设置
  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ["setup-status"],
    queryFn: setupApi.checkStatus,
    retry: 3,
    staleTime: 0, // 总是重新检查
  });

  // 如果已经登录，重定向到仪表板
  if (isAuthenticated) {
    return <Navigate to="/files" />;
  }

  if (authLoading || setupLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <div>正在检查系统状态...</div>
        </div>
      </div>
    );
  }

  // 如果需要初始化设置，重定向到设置页面
  if (setupStatus?.needs_setup) {
    return <Navigate to="/setup" />;
  }

  return <LoginForm />;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
