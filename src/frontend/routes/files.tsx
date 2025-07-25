import { Navigate, createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  File,
  Folder,
  FolderOpen,
  Grid3X3,
  HardDrive,
  Home,
  List,
  LogOut,
  MoreVertical,
  Search,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/useAuth";

// 模拟文件数据
const mockFiles = [
  {
    id: 1,
    name: "Documents",
    type: "folder",
    size: null,
    modified: "2024-01-15",
    items: 12,
  },
  {
    id: 2,
    name: "Images",
    type: "folder",
    size: null,
    modified: "2024-01-14",
    items: 8,
  },
  {
    id: 3,
    name: "project-report.pdf",
    type: "file",
    size: "2.4 MB",
    modified: "2024-01-13",
    items: null,
  },
  {
    id: 4,
    name: "presentation.pptx",
    type: "file",
    size: "8.1 MB",
    modified: "2024-01-12",
    items: null,
  },
  {
    id: 5,
    name: "data.xlsx",
    type: "file",
    size: "1.2 MB",
    modified: "2024-01-11",
    items: null,
  },
  {
    id: 6,
    name: "backup.zip",
    type: "file",
    size: "15.6 MB",
    modified: "2024-01-10",
    items: null,
  },
];

function FilesPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  const filteredFiles = mockFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* 顶部导航栏 */}
      <header className="flex-shrink-0 border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Storkitty</h1>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.username}</span>
            </div>
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">退出</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 - 在小屏幕上隐藏 */}
        <aside className="hidden md:flex w-64 border-r bg-card/30 flex-col">
          <div className="p-4">
            <nav className="space-y-2">
              <Button variant="default" className="w-full justify-start gap-2">
                <Home className="h-4 w-4" />
                全部文件
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Folder className="h-4 w-4" />
                文档
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <File className="h-4 w-4" />
                图片
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Trash2 className="h-4 w-4" />
                回收站
              </Button>
            </nav>
          </div>

          {/* 存储空间信息 - 固定到底部 */}
          <div className="mt-auto p-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="text-sm font-medium mb-2">存储空间</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>已使用</span>
                  <span>27.3 GB</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: "45%" }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  剩余 32.7 GB / 60 GB
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 p-4 md:p-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件和文件夹..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">上传</span>
                </Button>

                <div className="flex rounded-md border">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 面包屑导航 */}
            <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
              <Home className="h-4 w-4" />
              <span>/</span>
              <span className="text-foreground">根目录</span>
            </div>
          </div>

          {/* 文件列表 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredFiles.map((file) => (
                  <Card
                    key={file.id}
                    className="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardContent className="p-3">
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-muted group-hover:bg-muted/80">
                          {file.type === "folder" ? (
                            <FolderOpen className="h-5 w-5 text-primary" />
                          ) : (
                            <File className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="text-center w-full">
                          <p
                            className="text-xs font-medium truncate w-full"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.type === "folder"
                              ? `${file.items} 项`
                              : file.size}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-muted group-hover:bg-muted/80">
                        {file.type === "folder" ? (
                          <FolderOpen className="h-4 w-4 text-primary" />
                        ) : (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.type === "folder"
                            ? `${file.items} 项目`
                            : file.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{file.modified}</span>
                      </div>

                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "未找到匹配的文件" : "文件夹为空"}
                </h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery
                    ? "尝试使用不同的关键词搜索"
                    : "上传一些文件来开始使用"}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/files")({
  component: FilesPage,
});
