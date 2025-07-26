import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { UploadDrawer } from "../components/UploadDrawer";
import { UploadIndicator } from "../components/UploadIndicator";
import { AuthProvider } from "../contexts/AuthContext";
import { UploadProvider } from "../contexts/UploadContext";
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
      retry: 1,
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UploadProvider>
          <div className="min-h-screen bg-background">
            <Outlet />
            <ReactQueryDevtools initialIsOpen={false} />

            {/* Global upload components */}
            <UploadDrawer />
            <UploadIndicator />
          </div>
        </UploadProvider>
      </AuthProvider>
    </QueryClientProvider>
  ),
});
