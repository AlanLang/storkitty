import { Navigate, createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // 如果已经登录，重定向到仪表板
  if (isAuthenticated) {
    return <Navigate to="/files" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>加载中...</div>
      </div>
    );
  }

  return <LoginForm />;
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
