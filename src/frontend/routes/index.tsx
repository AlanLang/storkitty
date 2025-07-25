import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

function IndexPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>加载中...</div>
      </div>
    );
  }

  // 根据认证状态自动重定向
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return <Navigate to="/login" />;
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
