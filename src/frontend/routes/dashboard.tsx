import { Navigate, createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

function DashboardPage() {
  const { state, logout } = useAuth();

  // 如果未登录，重定向到登录页
  if (!state.isAuthenticated && !state.isLoading) {
    return <Navigate to="/login" />;
  }

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

  return (
    <div style={{ padding: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "1rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#333" }}>欢迎回来!</h1>
          <p style={{ margin: "0.5rem 0 0 0", color: "#666" }}>
            用户: {state.user?.username} ({state.user?.email})
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          退出登录
        </button>
      </div>

      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2>文件管理仪表板</h2>
        <p>这是受保护的页面内容。只有登录用户才能看到这里的内容。</p>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#e3f2fd",
            borderRadius: "4px",
            border: "1px solid #2196f3",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#1976d2" }}>系统信息</h3>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>认证状态: ✅ 已登录</li>
            <li>会话管理: JWT Token</li>
            <li>用户权限: 管理员</li>
            <li>文件管理: 准备就绪</li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1rem",
            backgroundColor: "#f3e5f5",
            borderRadius: "4px",
            border: "1px solid #9c27b0",
          }}
        >
          <h3 style={{ margin: "0 0 1rem 0", color: "#7b1fa2" }}>
            即将推出的功能
          </h3>
          <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
            <li>📁 文件浏览和目录管理</li>
            <li>⬆️ 文件上传（支持拖拽）</li>
            <li>⬇️ 文件下载和批量下载</li>
            <li>✏️ 文件重命名和移动</li>
            <li>🗑️ 文件删除和回收站</li>
            <li>🔍 文件搜索和过滤</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});
