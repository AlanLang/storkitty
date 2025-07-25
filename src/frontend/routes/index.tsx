import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

function IndexPage() {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>加载中...</div>
      </div>
    );
  }

  // 根据认证状态自动重定向
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  return <Navigate to="/login" />;
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
