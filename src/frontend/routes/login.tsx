import { Navigate, createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "../components/LoginForm";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // 如果已经登录，重定向到仪表板
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  if (isLoading) {
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

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <LoginForm />
    </div>
  );
}

export const Route = createFileRoute("/login")({
  component: LoginPage,
});
