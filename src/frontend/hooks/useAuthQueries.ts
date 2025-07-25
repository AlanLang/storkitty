import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  verify: (token: string) => [...authKeys.all, "verify", token] as const,
};

// 登录 mutation
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.success && data.token) {
        // 保存 token 到 localStorage
        localStorage.setItem("token", data.token);

        // 触发自定义事件通知 token 变化
        window.dispatchEvent(new Event("tokenChange"));

        // 预填充用户验证查询缓存
        queryClient.setQueryData(authKeys.verify(data.token), async () => {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          return authApi.verify(data.token!);
        });
      }
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // 清理可能的旧 token
      localStorage.removeItem("token");
      // 触发自定义事件通知 token 变化
      window.dispatchEvent(new Event("tokenChange"));
    },
  });
}

// Token 验证 query
export function useVerifyTokenQuery(token: string | null, enabled = true) {
  return useQuery({
    queryKey: authKeys.verify(token || ""),
    queryFn: () => {
      if (!token) {
        throw new Error("No token provided");
      }
      return authApi.verify(token);
    },
    enabled: enabled && !!token,
    retry: false, // 认证失败不重试
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// 登出功能
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    // 清理 localStorage
    localStorage.removeItem("token");

    // 触发自定义事件通知 token 变化
    window.dispatchEvent(new Event("tokenChange"));

    // 清理所有认证相关的查询缓存
    queryClient.removeQueries({ queryKey: authKeys.all });

    // 重置所有查询状态
    queryClient.clear();
  };
}
