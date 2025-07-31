import { Navigate } from "@tanstack/react-router";
import { DirectoryProvider } from "../contexts/DirectoryContext";
import { UploadProvider } from "../contexts/UploadContext";
import { useAuth } from "../hooks/useAuth";
import { FilesArea } from "./FilesArea";
import { FilesHeader } from "./FilesHeader";
import { FilesSidebar } from "./FilesSidebar";
import { UploadDrawer } from "./UploadDrawer";
import { UploadIndicator } from "./UploadIndicator";

interface FilesPageComponentProps {
  currentPath?: string;
}

function FilesPageContent({
  currentPath,
}: {
  currentPath?: string;
}) {
  const { isAuthenticated, isLoading, directories } = useAuth();

  // 如果未登录，重定向到登录页
  if (!isAuthenticated && !isLoading) {
    return <Navigate to="/login" />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  // 获取默认目录ID
  const defaultDirectoryId =
    directories?.find((dir) => dir.default)?.id || directories?.[0]?.id;

  // 如果没有可用的目录，显示错误状态
  if (!defaultDirectoryId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">无可用存储目录</div>
          <p className="text-muted-foreground">请联系管理员配置存储目录</p>
        </div>
      </div>
    );
  }

  return (
    <DirectoryProvider initialDirectoryId={defaultDirectoryId}>
      <UploadProvider>
        <div className="h-screen bg-background flex flex-col">
          {/* 顶部导航栏 */}
          <FilesHeader />

          <div className="flex flex-1 overflow-hidden">
            {/* 侧边栏 */}
            <FilesSidebar />

            {/* 主内容区 */}
            <FilesArea currentPath={currentPath} />
          </div>

          {/* Upload components */}
          <UploadDrawer />
          <UploadIndicator />
        </div>
      </UploadProvider>
    </DirectoryProvider>
  );
}

export function FilesPageComponent({ currentPath }: FilesPageComponentProps) {
  return <FilesPageContent currentPath={currentPath} />;
}
