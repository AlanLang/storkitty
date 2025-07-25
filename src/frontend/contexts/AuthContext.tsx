import { type ReactNode, createContext, useState, useEffect } from "react";
import {
  useLoginMutation,
  useLogout,
  useVerifyTokenQuery,
} from "../hooks/useAuthQueries";
import type { LoginRequest, UserInfo } from "../types/auth";

export interface AuthContextType {
  user: UserInfo | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  loginError: string | null;
}

// biome-ignore lint/nursery/useComponentExportOnlyModules: <explanation>
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const logoutFn = useLogout();

  // 监听 localStorage 变化
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem("token"));
    };

    // 监听 storage 事件（跨标签页）
    window.addEventListener("storage", handleStorageChange);
    
    // 监听自定义事件（同一标签页）
    window.addEventListener("tokenChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("tokenChange", handleStorageChange);
    };
  }, []);

  // 使用 React Query hooks
  const loginMutation = useLoginMutation();
  const { data: user, isLoading, error: verifyError } = useVerifyTokenQuery(token);

  // 处理登录
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      const result = await loginMutation.mutateAsync(credentials);
      return result.success;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // 处理登出
  const logout = () => {
    logoutFn();
  };

  // 构建认证状态
  const isAuthenticated = !!user && !!token && !verifyError;
  const loginError = loginMutation.error?.message || null;

  const value: AuthContextType = {
    user: user || null,
    token,
    isAuthenticated,
    isLoading,
    isLoggingIn: loginMutation.isPending,
    login,
    logout,
    loginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
