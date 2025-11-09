import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useStorageInfoWithDirectoryQuery } from "../hooks/useFiles";
import { formatStorageSpace, getDirectoryIcon } from "../utils/fileUtils";
import { Button } from "./ui/button";

export function FilesSidebar({ space }: { space: string }) {
  const navigate = useNavigate();
  const { directories, isAuthenticated } = useAuth();

  // 处理目录选择
  const handleDirectorySelect = (directoryId: string) => {
    // 重置当前路径，因为切换目录了
    if (directoryId !== space) {
      navigate({
        to: "/list/$space/$",
        params: { space: directoryId, _splat: "" },
      });
    }
  };

  const directoriesLoading = false; // Auth already loaded if we got here
  const directoriesError = null;

  // 获取存储空间信息
  const { data: storageData, isLoading: storageLoading } =
    useStorageInfoWithDirectoryQuery(space, isAuthenticated);

  return (
    <aside className="hidden md:flex w-64 border-r sidebar flex-col">
      <div className="p-4">
        <nav className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
            存储目录
          </div>
          {directoriesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : directoriesError ? (
            <div className="text-xs text-destructive px-2">
              无法加载目录列表
            </div>
          ) : directories?.length ? (
            directories.map((directory) => {
              const IconComponent = getDirectoryIcon(directory.icon);
              const isSelected = space === directory.id;

              return (
                <Button
                  key={directory.id}
                  variant={isSelected ? "default" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => handleDirectorySelect(directory.id)}
                  title={directory.description}
                >
                  <IconComponent className="h-4 w-4" />
                  {directory.name}
                </Button>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground px-2">
              没有配置存储目录
            </div>
          )}
        </nav>
      </div>

      {/* 存储空间信息 - 固定到底部 */}
      <div className="mt-auto p-4">
        <div className="p-4 bg-muted/30 backdrop-blur-[30px] backdrop-saturate-[1.8] rounded-lg shadow-lg">
          <h3 className="text-sm font-medium mb-2">存储空间</h3>
          {storageLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : storageData?.success && storageData.storage ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>已使用</span>
                <span>
                  {formatStorageSpace(storageData.storage.used_bytes)}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${Math.min(storageData.storage.used_percentage, 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                剩余
                {formatStorageSpace(
                  storageData.storage.total_bytes -
                    storageData.storage.used_bytes,
                )}
                / {formatStorageSpace(storageData.storage.total_bytes)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              无法获取存储信息
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
