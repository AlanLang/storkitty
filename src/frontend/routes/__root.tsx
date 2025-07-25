import { Outlet, createRootRoute } from "@tanstack/react-router";
import { AuthProvider } from "../contexts/AuthContext";

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
        <Outlet />
      </div>
    </AuthProvider>
  ),
});
