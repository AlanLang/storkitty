import { useApp } from "@/hooks/use-app";
import { Navigate } from "@tanstack/react-router";

export function AuthRouter({ children }: { children: React.ReactNode }) {
  const appInfo = useApp();
  if (!appInfo.loggedIn) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}
