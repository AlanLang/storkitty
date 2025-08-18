import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronRight,
  Copy,
  Download,
  Edit,
  File,
  FileText,
  FolderOpen,
  Home,
  Loader2,
  MoreVertical,
  Move,
  PencilLine,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { useClipboardOperations } from "../hooks/useClipboardOperations";
import { useDirectory } from "../hooks/useDirectory";
import {
  useCreateDirectoryMutation,
  useCreateFileMutation,
  useDeleteFileMutation,
  useFileListWithDirectoryQuery,
  useRenameFileMutation,
  useShowFileQuery,
} from "../hooks/useFiles";
import { useUpload } from "../hooks/useUploadContext";
import type { FileInfo } from "../types/files";
import {
  canCopyToClipboard,
  copyDownloadLink,
  downloadFile,
} from "../utils/download";
import { isEditable } from "../utils/editor";
import { formatFileSize } from "../utils/fileUtils";
import { CreateDirectoryDialog } from "./CreateDirectoryDialog";
import { CreateFileDialog } from "./CreateFileDialog";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { DownloadDialog } from "./DownloadDialog";
import { DownloadDrawer } from "./DownloadDrawer";
import { DownloadIndicator } from "./DownloadIndicator";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { RenameDialog } from "./RenameDialog";
import { TimeDisplay } from "./TimeDisplay";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";

interface FilesAreaProps {
  currentPath?: string;
}

export function FilesArea({ currentPath }: FilesAreaProps) {
  const navigate = useNavigate();
  const { selectedDirectoryId } = useDirectory();
  const { isAuthenticated } = useAuth();
  const { setIsDrawerOpen } = useUpload();
  const { handleMoveClick, handleCopyClick } =
    useClipboardOperations(currentPath);
  const [searchQuery, setSearchQuery] = useState("");

  // 获取面包屑路径
  const breadcrumbPaths = useMemo(() => {
    if (!currentPath) return [];
    return currentPath.split("/").filter(Boolean);
  }, [currentPath]);

  // 处理文件夹点击
  const handleFolderClick = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    navigate({
      to: "/files/$",
      params: { _splat: newPath },
    });
  };

  // 处理文件点击 - 导航到预览页面
  const handleFileClick = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    navigate({
      to: "/files/preview/$directoryId/$",
      params: {
        directoryId: selectedDirectoryId,
        _splat: filePath,
      },
    });
  };

  // 处理编辑点击 - 导航到预览页面的编辑模式
  const handleEditClick = (fileName: string) => {
    const filePath = currentPath ? `${currentPath}/${fileName}` : fileName;
    navigate({
      to: "/files/preview/$directoryId/$",
      params: {
        directoryId: selectedDirectoryId,
        _splat: filePath,
      },
      search: { edit: true },
    });
  };

  // 导航到特定路径
  const handleNavigateToPath = (pathIndex: number) => {
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

  // 处理上传按钮点击
  const handleUploadClick = () => {
    setIsDrawerOpen(true);
  };

  // 对话框状态管理
  const [deleteFile, setDeleteFile] = useState<FileInfo | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDirectoryDialogOpen, setIsCreateDirectoryDialogOpen] =
    useState(false);
  const [isCreateFileDialogOpen, setIsCreateFileDialogOpen] = useState(false);
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDownloadDrawerOpen, setIsDownloadDrawerOpen] = useState(false);

  // Mutations
  const deleteFileMutation = useDeleteFileMutation();
  const createDirectoryMutation = useCreateDirectoryMutation();
  const createFileMutation = useCreateFileMutation();
  const renameFileMutation = useRenameFileMutation();

  // 获取文件数据
  const {
    data: filesData,
    isLoading: filesLoading,
    error: filesError,
  } = useFileListWithDirectoryQuery(
    selectedDirectoryId,
    currentPath,
    isAuthenticated,
  );

  const files = filesData?.files || [];

  // 检测当前目录中是否有 README 文件
  const readmeFile = useMemo(() => {
    if (!files || files.length === 0) return null;

    const readmeNames = ["README.md", "readme.md", "Readme.md", "ReadMe.md"];
    return files.find(
      (file) => file.file_type === "file" && readmeNames.includes(file.name),
    );
  }, [files]);

  // 构造 README 文件的完整路径
  const readmeFilePath = useMemo(() => {
    if (!readmeFile) return null;
    return currentPath ? `${currentPath}/${readmeFile.name}` : readmeFile.name;
  }, [readmeFile, currentPath]);

  // 查询 README 内容
  const { data: readmeData } = useShowFileQuery(
    selectedDirectoryId,
    readmeFilePath || "",
    isAuthenticated && !filesLoading && !filesError && !!readmeFilePath,
  );

  // 检查是否有 README 内容可显示
  const hasReadmeContent =
    readmeFile && readmeData?.success && readmeData.content;

  // 文件操作处理函数
  const handleDownload = (file: FileInfo) => {
    if (file.file_type === "folder") {
      return;
    }
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    downloadFile(filePath, file.name, selectedDirectoryId);
  };

  const handleCopyDownloadLink = async (file: FileInfo) => {
    if (file.file_type === "folder") {
      return;
    }
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    const success = await copyDownloadLink(filePath, selectedDirectoryId);

    if (success) {
      toast.success("下载链接已复制到剪贴板");
    } else {
      toast.error("复制下载链接失败");
    }
  };

  const handleDeleteClick = (file: FileInfo) => {
    setDeleteFile(file);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteFile) return;

    const filePath = currentPath
      ? `${currentPath}/${deleteFile.name}`
      : deleteFile.name;

    await deleteFileMutation.mutateAsync({
      filePath,
      directoryId: selectedDirectoryId,
    });
  };

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false);
    setDeleteFile(null);
  };

  const handleCreateDirectoryClick = () => {
    setIsCreateDirectoryDialogOpen(true);
  };

  const handleCreateDirectoryConfirm = async (directoryName: string) => {
    const directoryPath = currentPath
      ? `${currentPath}/${directoryName}`
      : directoryName;

    await createDirectoryMutation.mutateAsync({
      directoryPath,
      directoryId: selectedDirectoryId,
    });
  };

  const handleCreateDirectoryDialogClose = () => {
    setIsCreateDirectoryDialogOpen(false);
  };

  const handleCreateFileClick = () => {
    setIsCreateFileDialogOpen(true);
  };

  const handleCreateFileConfirm = async (filename: string) => {
    // 学习 mkdir 的做法，在前端拼接完整路径
    const filePath = currentPath ? `${currentPath}/${filename}` : filename;

    await createFileMutation.mutateAsync({
      directoryId: selectedDirectoryId,
      filePath,
      content: "", // 创建空文件
    });
  };

  const handleCreateFileDialogClose = () => {
    setIsCreateFileDialogOpen(false);
  };

  const handleRenameClick = (file: FileInfo) => {
    setRenameFile(file);
    setIsRenameDialogOpen(true);
  };

  const handleRenameConfirm = async (newName: string) => {
    if (!renameFile) return;

    const filePath = currentPath
      ? `${currentPath}/${renameFile.name}`
      : renameFile.name;

    await renameFileMutation.mutateAsync({
      filePath,
      newName,
      directoryId: selectedDirectoryId,
    });
  };

  const handleRenameDialogClose = () => {
    setIsRenameDialogOpen(false);
    setRenameFile(null);
  };

  // 过滤和搜索文件
  const filteredFiles = useMemo(() => {
    if (!files) return [];

    if (!searchQuery.trim()) {
      return files;
    }

    return files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
    );
  }, [files, searchQuery]);

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 md:p-6 md:pb-2 pb-2">
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
              onClick={handleCreateFileClick}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">新建文件</span>
            </Button>

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
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">上传</span>
            </Button>
            <DownloadDialog currentPath={currentPath} />
          </div>
        </div>

        {/* 面包屑导航 */}
        <div className="flex items-center space-x-2 mb-4 text-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigateToPath(-1)}
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
                onClick={() => handleNavigateToPath(index)}
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
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 md:pb-6 ">
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
        ) : (
          <div
            data-testid="file-list"
            className="divide-y divide-border border"
          >
            {filteredFiles.map((file, index) => (
              <div
                key={`${file.path}-${index}`}
                className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer group mt-0"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (file.file_type === "folder") {
                      handleFolderClick(file.name);
                    } else {
                      handleFileClick(file.name);
                    }
                  }
                }}
                onClick={() => {
                  if (file.file_type === "folder") {
                    handleFolderClick(file.name);
                  } else {
                    handleFileClick(file.name);
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
                  <div className="text-xs text-muted-foreground">
                    <TimeDisplay timeString={file.modified} />
                  </div>

                  <div className="flex items-center opacity-0 group-hover:opacity-100 [&:has([data-state=open])]:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`file-more-actions-button-${file.name}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {file.file_type === "file" && (
                          <>
                            {/* 编辑选项 - 仅对可编辑文件且已登录用户显示 */}
                            {isAuthenticated &&
                              isEditable(
                                file.name.split(".").pop()?.toLowerCase() || "",
                              ) && (
                                <>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClick(file.name);
                                    }}
                                    className="cursor-pointer focus-visible:outline-none"
                                  >
                                    <PencilLine className="mr-2 h-4 w-4" />
                                    编辑文件
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file);
                              }}
                              className="cursor-pointer focus-visible:outline-none"
                            >
                              <Download className="mr-2 h-4 w-4" />
                              下载文件
                            </DropdownMenuItem>
                            {canCopyToClipboard() && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyDownloadLink(file);
                                }}
                                className="cursor-pointer focus-visible:outline-none"
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                复制下载链接
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveClick(file);
                          }}
                          className="cursor-pointer focus-visible:outline-none"
                        >
                          <Move className="mr-2 h-4 w-4" />
                          移动
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyClick(file);
                          }}
                          className="cursor-pointer focus-visible:outline-none"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          复制
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameClick(file);
                          }}
                          className="cursor-pointer focus-visible:outline-none"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(file);
                          }}
                          className="cursor-pointer text-destructive focus:text-destructive focus-visible:outline-none"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                          {file.file_type === "folder" ? "文件夹" : "文件"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                onClick={handleUploadClick}
              >
                <Upload className="h-4 w-4" />
                上传文件
              </Button>
            )}
          </div>
        )}

        {/* README 渲染区域 - 显示在文件列表下方 */}
        {hasReadmeContent && readmeData?.content && (
          <div className="mt-4 flex flex-col divide-y divide-border border">
            <div className="p-4 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">README</span>
              </div>
              {/* README 编辑按钮 - 仅登录用户可见 */}
              {isAuthenticated && readmeFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditClick(readmeFile.name)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <PencilLine className="h-4 w-4" />
                </Button>
              )}
            </div>
            <MarkdownRenderer content={readmeData.content} />
          </div>
        )}
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

      {/* 创建文件对话框 */}
      <CreateFileDialog
        isOpen={isCreateFileDialogOpen}
        onClose={handleCreateFileDialogClose}
        onConfirm={handleCreateFileConfirm}
        currentPath={currentPath}
      />

      {/* 重命名对话框 */}
      <RenameDialog
        isOpen={isRenameDialogOpen}
        onClose={handleRenameDialogClose}
        onConfirm={handleRenameConfirm}
        file={renameFile}
        isRenaming={renameFileMutation.isPending}
      />

      {/* 下载指示器和抽屉 */}
      <DownloadIndicator onOpenDrawer={() => setIsDownloadDrawerOpen(true)} />
      <DownloadDrawer
        isOpen={isDownloadDrawerOpen}
        onClose={() => setIsDownloadDrawerOpen(false)}
      />
    </main>
  );
}
