import { useQueryClient } from "@tanstack/react-query";
import { Navigate, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronRight,
  Download,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Grid3X3,
  HardDrive,
  Home,
  List,
  Loader2,
  LogOut,
  MoreVertical,
  Search,
  Trash2,
  Upload,
  User as UserIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UploadResponse } from "../api/upload";
import { useAuth } from "../hooks/useAuth";
import {
  filesKeys,
  useCreateDirectoryMutation,
  useDeleteFileMutation,
  useFileListQuery,
  useStorageInfoQuery,
} from "../hooks/useFiles";
import { useUpload } from "../hooks/useUploadContext";
import type { FileInfo } from "../types/files";
import { CreateDirectoryDialog } from "./CreateDirectoryDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";

// 格式化文件大小
function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  if (unitIndex === 0) {
    return `${bytes} ${units[unitIndex]}`;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// 格式化存储空间
function formatStorageSpace(bytes: number): string {
  return formatFileSize(bytes);
}

// 根据文件扩展名获取图标
function getFileIcon(fileName: string, fileType: string) {
  if (fileType === "folder") {
    return FolderOpen;
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  // 图片文件
  if (
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"].includes(
      extension || "",
    )
  ) {
    return FileImage;
  }

  // 视频文件
  if (
    ["mp4", "avi", "mov", "mkv", "flv", "webm", "m4v"].includes(extension || "")
  ) {
    return FileVideo;
  }

  // 文档文件
  if (["txt", "doc", "docx", "pdf", "rtf", "md"].includes(extension || "")) {
    return FileText;
  }

  // 代码文件
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "py",
      "java",
      "cpp",
      "c",
      "rs",
      "go",
    ].includes(extension || "")
  ) {
    return FileCode;
  }

  // 压缩文件
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension || "")) {
    return FileArchive;
  }

  // 默认文件图标
  return File;
}

// 根据文件类型获取图标颜色
function getFileIconColor(fileName: string, fileType: string) {
  if (fileType === "folder") {
    return "text-primary";
  }

  const extension = fileName.split(".").pop()?.toLowerCase();

  // 图片文件 - 绿色
  if (
    ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"].includes(
      extension || "",
    )
  ) {
    return "text-green-500";
  }

  // 视频文件 - 红色
  if (
    ["mp4", "avi", "mov", "mkv", "flv", "webm", "m4v"].includes(extension || "")
  ) {
    return "text-red-500";
  }

  // 文档文件 - 蓝色
  if (["txt", "doc", "docx", "pdf", "rtf", "md"].includes(extension || "")) {
    return "text-blue-500";
  }

  // 代码文件 - 紫色
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "py",
      "java",
      "cpp",
      "c",
      "rs",
      "go",
    ].includes(extension || "")
  ) {
    return "text-purple-500";
  }

  // 压缩文件 - 橙色
  if (["zip", "rar", "7z", "tar", "gz", "bz2"].includes(extension || "")) {
    return "text-orange-500";
  }

  // 默认颜色
  return "text-muted-foreground";
}

interface FilesPageComponentProps {
  currentPath?: string;
}

export function FilesPageComponent({ currentPath }: FilesPageComponentProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deleteFile, setDeleteFile] = useState<FileInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDirectoryDialogOpen, setIsCreateDirectoryDialogOpen] =
    useState(false);
  const { setIsDrawerOpen, setOnUploadComplete } = useUpload();
  const queryClient = useQueryClient();

  // 删除文件 mutation
  const deleteFileMutation = useDeleteFileMutation();

  // 创建目录 mutation
  const createDirectoryMutation = useCreateDirectoryMutation();

  // 获取文件列表
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useFileListQuery(currentPath, isAuthenticated);

  // 处理文件夹点击
  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    navigate({
      to: "/files/$",
      params: { _splat: newPath },
    });
  };

  // 设置上传完成回调
  const handleUploadComplete = useCallback(
    (_results: UploadResponse[]) => {
      // 刷新文件列表
      queryClient.invalidateQueries({ queryKey: filesKeys.list(currentPath) });
      queryClient.invalidateQueries({ queryKey: filesKeys.storage() });
    },
    [currentPath, queryClient],
  );

  // 设置上传完成回调到上传上下文
  useEffect(() => {
    setOnUploadComplete(handleUploadComplete);
  }, [setOnUploadComplete, handleUploadComplete]);

  // 处理删除文件点击
  const handleDeleteClick = (file: FileInfo) => {
    setDeleteFile(file);
    setIsDeleteDialogOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (!deleteFile) return;

    const filePath = currentPath
      ? `${currentPath}/${deleteFile.name}`
      : deleteFile.name;
    await deleteFileMutation.mutateAsync(filePath);
  };

  // 关闭删除对话框
  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeleteFile(null);
  };

  // 处理创建目录确认
  const handleCreateDirectoryConfirm = async (directoryName: string) => {
    const directoryPath = currentPath
      ? `${currentPath}/${directoryName}`
      : directoryName;
    await createDirectoryMutation.mutateAsync(directoryPath);
  };

  // 处理创建目录按钮点击
  const handleCreateDirectoryClick = () => {
    setIsCreateDirectoryDialogOpen(true);
  };

  // 关闭创建目录对话框
  const handleCreateDirectoryDialogClose = () => {
    setIsCreateDirectoryDialogOpen(false);
  };

  // 获取面包屑路径
  const breadcrumbPaths = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split("/").filter(Boolean);
  }, [currentPath]);

  // 导航到特定路径
  const navigateToPath = (pathIndex: number) => {
    if (pathIndex === -1) {
      // 导航到根目录
      navigate({ to: "/files" });
    } else {
      const newPath = breadcrumbPaths.slice(0, pathIndex + 1).join("/");
      navigate({
        to: "/files/$",
        params: { _splat: newPath },
      });
    }
  };

  // 获取存储空间信息
  const { data: storageData, isLoading: storageLoading } =
    useStorageInfoQuery(isAuthenticated);

  // 过滤和搜索文件
  const filteredFiles = useMemo(() => {
    if (!filesData?.files) return [];

    if (!searchQuery.trim()) {
      return filesData.files;
    }

    return filesData.files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );
  }, [filesData?.files, searchQuery]);

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
              <Button
                variant="default"
                className="w-full justify-start gap-2"
                onClick={() => navigate({ to: "/files" })}
              >
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
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCreateDirectoryClick}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="hidden sm:inline">新建文件夹</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setIsDrawerOpen(true)}
                >
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
            <div className="flex items-center space-x-2 mb-4 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToPath(-1)}
                className="p-1 h-6 hover:bg-muted"
              >
                <Home className="h-4 w-4" />
              </Button>

              {breadcrumbPaths.map((pathPart, index) => (
                <div key={pathPart} className="flex items-center space-x-2">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigateToPath(index)}
                    className={`p-1 h-6 text-sm hover:bg-muted ${
                      index === breadcrumbPaths.length - 1
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {pathPart}
                  </Button>
                </div>
              ))}

              {breadcrumbPaths.length === 0 && (
                <>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground font-medium">根目录</span>
                </>
              )}
            </div>
          </div>

          {/* 文件列表 - 可滚动区域 */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6">
            {filesLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">加载文件列表中...</p>
              </div>
            ) : filesError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">加载失败</h3>
                <p className="text-muted-foreground text-center">
                  无法获取文件列表，请检查网络连接或重试
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                {filteredFiles.map((file, index) => (
                  <Card
                    key={`${file.path}-${index}`}
                    className="relative overflow-hidden border-0 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 hover:bg-card/70 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    onClick={() => {
                      if (file.file_type === "folder") {
                        handleFolderClick(file.name);
                      }
                    }}
                  >
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(file);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>

                    <CardContent className="p-4">
                      <div className="flex flex-col items-center space-y-3">
                        {/* 图标区域 */}
                        <div className="relative">
                          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-muted/50 to-muted group-hover:from-muted/60 group-hover:to-muted/80 transition-all duration-200">
                            {(() => {
                              const IconComponent = getFileIcon(
                                file.name,
                                file.file_type,
                              );
                              const iconColor = getFileIconColor(
                                file.name,
                                file.file_type,
                              );

                              return (
                                <IconComponent
                                  className={`h-8 w-8 ${iconColor} group-hover:scale-110 transition-all duration-200`}
                                />
                              );
                            })()}
                          </div>
                        </div>

                        {/* 文件信息 */}
                        <div className="text-center w-full space-y-1">
                          <p
                            className="text-sm font-medium text-foreground leading-tight truncate w-full px-1"
                            title={file.name}
                          >
                            {file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {file.file_type === "folder"
                              ? `${file.items || 0} 项目`
                              : file.size
                                ? formatFileSize(file.size)
                                : "未知大小"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredFiles.map((file, index) => (
                  <div
                    key={`${file.path}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer group"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (file.file_type === "folder") {
                          handleFolderClick(file.name);
                        }
                      }
                    }}
                    onClick={() => {
                      if (file.file_type === "folder") {
                        handleFolderClick(file.name);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-muted group-hover:bg-muted/80">
                        {file.file_type === "folder" ? (
                          <FolderOpen className="h-4 w-4 text-primary" />
                        ) : (
                          <File className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.file_type === "folder"
                            ? `${file.items || 0} 项目`
                            : file.size
                              ? formatFileSize(file.size)
                              : "未知大小"}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(file);
                          }}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
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

            {!filesLoading && !filesError && filteredFiles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-muted/30 to-muted/50 mb-6">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {searchQuery ? "未找到匹配的文件" : "文件夹为空"}
                </h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  {searchQuery
                    ? "尝试使用不同的关键词搜索，或检查文件名拼写"
                    : "此文件夹中还没有任何文件。上传一些文件来开始使用吧"}
                </p>
                {!searchQuery && (
                  <Button
                    variant="outline"
                    className="mt-4 gap-2"
                    onClick={() => setIsDrawerOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    上传文件
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleDeleteDialogClose}
        onConfirm={handleDeleteConfirm}
        file={deleteFile}
        isDeleting={deleteFileMutation.isPending}
      />

      {/* 创建目录对话框 */}
      <CreateDirectoryDialog
        isOpen={isCreateDirectoryDialogOpen}
        onClose={handleCreateDirectoryDialogClose}
        onConfirm={handleCreateDirectoryConfirm}
        isCreating={createDirectoryMutation.isPending}
      />
    </div>
  );
}
