import { extractFile } from "@/api/file/extract";
import type { FileInfo } from "@/api/file/list";
import { MenuList, type MenuListProps } from "@/components/menu-list";
import { TimeDisplay } from "@/components/time-display";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { useApp } from "@/hooks/use-app";
import { QUERY_KEY, useFileList } from "@/hooks/use-file-list";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskProvider, useFileUploadDialog } from "@/hooks/use-task";
import { formatFileSize } from "@/lib/file";
import { urlJoin } from "@/lib/urlJoin";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ChevronRight,
  Circle,
  CloudDownload,
  Copy,
  Eye,
  FilePlus,
  FolderOpen,
  FolderPen,
  FolderPlus,
  Home,
  Link,
  MoreHorizontalIcon,
  MoreVertical,
  SendToBack,
  SquareArrowOutUpRight,
  Trash2,
  UploadIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FileIcon } from "./components/file-icon";
import { FileListEmpty } from "./components/file-list-empty";
import { ListContextMenu } from "./components/list-context-menu";
import { ListDialog, type ListDialogProps } from "./components/list-dialog";
import { ReadmePreview } from "./components/readme-preview";
import { FileListSidebar } from "./components/sidebar";
import { createDownloadUrl, downloadFile } from "./utils/downloadFile";
import { writeTextIntoClipboard } from "./utils/writeTextIntoClipboard";

export const Route = createFileRoute("/list/$space/$")({
  component: RouteComponent,
});

function RouteComponent() {
  const { space } = Route.useParams();
  const appInfo = useApp();
  if (!appInfo.storages?.some((storage) => storage.path === space)) {
    return (
      <Navigate
        to="/list/$space/$"
        params={{ space: appInfo.storages?.at(0)?.path ?? "data" }}
      />
    );
  }

  return (
    <TaskProvider>
      <FilePage />
    </TaskProvider>
  );
}

function FilePage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<ListDialogProps["open"]>(null);
  const { space, _splat } = Route.useParams();
  const path = urlJoin(space, _splat ?? "");
  const { openFileDialog } = useFileUploadDialog();
  const isMobile = useIsMobile();

  return (
    <div className="flex h-full w-full">
      <FileListSidebar />
      <ListContextMenu
        disabled={isMobile}
        onUpload={openFileDialog}
        onCreateFolder={() => setOpen({ type: "create-folder", file: null })}
        onCreateFile={(defaultName) =>
          setOpen({ type: "create-file", file: null, defaultName })
        }
        onRemoteDownload={() =>
          setOpen({ type: "remote-download", file: null })
        }
      >
        <SidebarInset className="flex-1 flex flex-col">
          <div className="border-b p-4 flex items-center h-18">
            <FileToolbar
              onOpenFileUpload={openFileDialog}
              onCreateFolder={() =>
                setOpen({ type: "create-folder", file: null })
              }
              onCreateFile={(defaultName) =>
                setOpen({ type: "create-file", file: null, defaultName })
              }
              onRemoteDownload={() =>
                setOpen({ type: "remote-download", file: null })
              }
            />
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4">
            <FileBreadcrumb />
            <FileList
              onDelete={(file) => setOpen({ type: "delete", file })}
              onRename={(file) => setOpen({ type: "rename", file })}
              onEdit={(file) => setOpen({ type: "edit", file })}
              onCopy={(file) => setOpen({ type: "copy", file })}
              onMove={(file) => setOpen({ type: "move", file })}
            />
          </div>
        </SidebarInset>
      </ListContextMenu>
      <ListDialog
        path={path}
        open={open}
        onCancel={() => setOpen(null)}
        onFinish={() => {
          setOpen(null);
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY, path],
          });
          queryClient.invalidateQueries({
            queryKey: ["readme-content", `${path}/README.md`.toUpperCase()],
          });
        }}
      />
    </div>
  );
}

interface FileToolbarProps {
  onOpenFileUpload: () => void;
  onCreateFolder: () => void;
  onCreateFile: (defaultName: string) => void;
  onRemoteDownload: () => void;
}

function FileToolbar(props: FileToolbarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-4">
      <div className="flex-1 flex items-center gap-2">
        <SidebarTrigger />
        <Input placeholder="搜索文件" className="w-full" />
      </div>
      <div className="flex items-center gap-2">
        <Toggle
          aria-label="Toggle bookmark"
          size="sm"
          variant="outline"
          className="data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
        >
          <Circle />
        </Toggle>
        <ButtonGroup>
          <Button variant="outline" onClick={props.onOpenFileUpload}>
            <UploadIcon />
            上传
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More Options"
                className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border"
              >
                <MoreHorizontalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={props.onOpenFileUpload}>
                  <UploadIcon />
                  上传文件
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => props.onCreateFile("新文件.txt")}
                >
                  <FilePlus />
                  新建文件
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    props.onCreateFolder();
                  }}
                >
                  <FolderPlus />
                  新建文件夹
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={props.onRemoteDownload}>
                  <CloudDownload />
                  离线下载
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>
    </div>
  );
}

function FileBreadcrumb() {
  const { space, _splat } = Route.useParams();
  const navigate = useNavigate();
  const breadcrumbPaths = _splat === "" ? [] : _splat?.split("/") || [];

  return (
    <div className="flex items-center space-x-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigate({ to: "/list/$space/$", params: { space, _splat: "" } });
        }}
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
            onClick={() => {
              navigate({
                to: "/list/$space/$",
                params: {
                  space,
                  _splat: breadcrumbPaths.slice(0, index + 1).join("/"),
                },
              });
            }}
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
  );
}

function FileList({
  onDelete,
  onRename,
  onEdit,
  onCopy,
  onMove,
}: {
  onDelete: (file: FileInfo) => void;
  onRename: (file: FileInfo) => void;
  onEdit: (file: FileInfo) => void;
  onCopy: (file: FileInfo) => void;
  onMove: (file: FileInfo) => void;
}) {
  const queryClient = useQueryClient();
  const { space, _splat } = Route.useParams();
  const navigate = useNavigate();
  const path = urlJoin(space, _splat ?? "");
  const { data, isLoading, error } = useFileList({ path });

  const handleExtract = async (file: FileInfo) => {
    const extractPromise = extractFile({ path, name: file.name });

    toast.promise(extractPromise, {
      loading: "解压中...",
      success: () => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, path] });
        return "解压成功";
      },
      error: "解压失败",
    });
  };

  const handleClick = (file: FileInfo) => {
    if (file.fileType === "folder") {
      navigate({
        to: "/list/$space/$",
        params: { space, _splat: `${_splat}/${file.name}` },
      });
    } else {
      onEdit(file);
    }
  };

  if (isLoading) {
    return (
      <div className="divide-y divide-border animate-fade-in-delayed">
        {Array.from({ length: 5 }, (_, index) => index + 1).map((step) => (
          <div
            key={step}
            className="flex items-center p-3 hover:bg-muted/50 cursor-pointer group mt-0 gap-3"
          >
            <Skeleton className="w-8 h-8 flex items-center justify-center rounded bg-muted group-hover:bg-muted/80" />
            <div className="space-y-2 w-full">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-12">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground text-center">
          无法获取文件列表，请检查网络连接或重试
        </p>
      </div>
    );
  }

  if (data && data.files.length === 0) {
    return <FileListEmpty />;
  }

  const readmeFile = data?.files.find(
    (file) => file.name.toUpperCase() === "README.md".toUpperCase(),
  );

  return (
    <>
      <div data-testid="file-list" className="divide-y divide-border border">
        {data?.files.map((file) => (
          <FileListItem
            path={path}
            key={file.name}
            file={file}
            onClick={handleClick}
            onDelete={onDelete}
            onRename={onRename}
            onEdit={onEdit}
            onCopy={onCopy}
            onMove={onMove}
            onExtract={handleExtract}
          />
        ))}
      </div>
      {readmeFile && (
        <ReadmePreview
          file={readmeFile}
          path={path}
          onEdit={() => onEdit(readmeFile)}
        />
      )}
    </>
  );
}

interface FileListItemProps {
  path: string;
  file: FileInfo;
  onDelete: (file: FileInfo) => void;
  onRename: (file: FileInfo) => void;
  onClick: (file: FileInfo) => void;
  onEdit: (file: FileInfo) => void;
  onCopy: (file: FileInfo) => void;
  onMove: (file: FileInfo) => void;
  onExtract: (file: FileInfo) => void;
}

function FileListItem({
  path,
  file,
  onClick,
  onDelete,
  onRename,
  onEdit,
  onCopy,
  onMove,
  onExtract,
}: FileListItemProps) {
  const isFolder = file.fileType === "folder";
  const isCompressed = !isFolder && /\.(zip|tar\.gz|tgz|tar)$/i.test(file.name);

  const baseItems: MenuListProps["items"] = [
    {
      label: "重命名",
      icon: <FolderPen className="mr-2 h-4 w-4" />,
      onClick: () => onRename(file),
    },
    {
      label: "复制",
      icon: <Copy className="mr-2 h-4 w-4" />,
      onClick: () => onCopy(file),
    },
    {
      label: "移动",
      icon: <SendToBack className="mr-2 h-4 w-4" />,
      onClick: () => onMove(file),
    },
    ...(isCompressed
      ? [
          {
            label: "解压缩",
            icon: <Archive className="mr-2 h-4 w-4" />,
            onClick: () => onExtract(file),
          },
          {
            type: "separator" as const,
          },
        ]
      : []),
    {
      type: "separator",
    },
    {
      label: "删除",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: () => onDelete(file),
    },
  ];

  const items: MenuListProps["items"] = isFolder
    ? baseItems
    : [
        {
          label: "查看",
          icon: <Eye className="mr-2 h-4 w-4" />,
          onClick: () => onEdit(file),
        },
        {
          label: "下载",
          icon: <CloudDownload className="mr-2 h-4 w-4" />,
          onClick: () => {
            downloadFile(path, file.name);
          },
        },
        {
          label: "预览",
          icon: <SquareArrowOutUpRight className="mr-2 h-4 w-4" />,
          onClick: () => {},
        },
        {
          label: "复制链接",
          icon: <Link className="mr-2 h-4 w-4" />,
          onClick: () => {
            const url = createDownloadUrl(path, file.name);
            writeTextIntoClipboard(url).then(() => {
              toast.success("链接已复制到剪贴板");
            });
          },
        },
        {
          type: "separator",
        },
        ...baseItems,
      ];

  return (
    <MenuList
      type="context"
      key={file.name}
      items={items}
      onClick={() => onClick(file)}
    >
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 data-[state=open]:bg-muted/50 has-data-[[state=open]]:bg-muted/50 cursor-pointer group mt-0">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center rounded bg-muted group-hover:bg-muted/80">
            <FileIcon fileInfo={file} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium min-w-0 truncate flex-1">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {file.fileType === "folder"
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
          <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 [&:has([data-state=open])]:opacity-100 transition-opacity">
            <MenuList type="dropdown" items={items}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
                data-testid={`file-more-actions-button-${file.name}`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </MenuList>
          </div>
        </div>
      </div>
    </MenuList>
  );
}
