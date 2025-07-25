import { type FormEvent, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");
  const { login, isLoading, loginError } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!username || !password) {
      setLocalError("请填写用户名和密码");
      return;
    }

    const success = await login({ username, password });
    if (!success && !loginError) {
      setLocalError("登录失败，请检查用户名和密码");
    }
  };

  // 统一错误显示
  const displayError = localError || loginError;

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div>验证登录状态中...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "2rem auto",
        padding: "2rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        backgroundColor: "#fff",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>登录</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="username"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            用户名:
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
            placeholder="请输入用户名"
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "0.5rem" }}
          >
            密码:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "1rem",
            }}
            placeholder="请输入密码"
          />
        </div>

        {displayError && (
          <div
            style={{
              color: "#d32f2f",
              marginBottom: "1rem",
              padding: "0.5rem",
              backgroundColor: "#ffebee",
              border: "1px solid #ffcdd2",
              borderRadius: "4px",
            }}
          >
            {displayError}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "登录中..." : "登录"}
        </button>
      </form>

      <div
        style={{
          marginTop: "1rem",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "4px",
          fontSize: "0.875rem",
        }}
      >
        <strong>测试账号:</strong>
        <br />
        用户名: admin
        <br />
        密码: admin123
      </div>
    </div>
  );
}
