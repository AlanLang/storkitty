import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AuthProvider } from "../contexts/AuthContext";
import { ClipboardProvider } from "../contexts/ClipboardContext";
import "../styles/globals.css";

// 创建 Query Client 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    },
    mutations: {
      retry: 0, // 不重试 mutations，特别是文件操作
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ClipboardProvider>
          <div className="min-h-screen bg-background">
            <Outlet />
            <ReactQueryDevtools initialIsOpen={false} />

            {/* Toast notifications */}
            <Toaster richColors position="top-right" />
          </div>
        </ClipboardProvider>
      </AuthProvider>
    </QueryClientProvider>
  ),
});
