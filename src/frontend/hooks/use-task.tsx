import type { FileType } from "@/api/file/list";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from "@/routes/list/$space/components/file-icon";
import { animated, config, useSpring } from "@react-spring/web";
import {
  BrushCleaning,
  ChevronDownIcon,
  Loader2,
  Maximize2,
  Minimize2,
  PackageOpen,
  Plus,
  Trash2,
  XIcon,
} from "lucide-react";
import { createContext, useContext, useMemo, useState } from "react";

import { FileUploader } from "@/api/file/upload";
import { QUERY_KEY } from "@/hooks/use-file-list";
import { formatFileSize } from "@/lib/file";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { useFileUpload } from "./use-file-upload";
import { useIsMobile } from "./use-mobile";
import { useWindowSize } from "./use-window-size";

export function useTaskDrawer() {
  return useContext(DrawerContext);
}

export function useFileUploadDialog() {
  return useContext(FileUploadContext);
}

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const { space, _splat } = useParams({ from: "/list/$space/$" });
  const path = `${space}/${_splat}`;
  const [mini, setMini] = useState(false);
  const [open, setOpen] = useState<DrawerType | null>(null);
  const isMobile = useIsMobile();
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const [uploader] = useState<FileUploader>(() => new FileUploader());
  const queryClient = useQueryClient();

  const {
    openFileDialog,
    getInputProps,
    cleanTasks,
    removeTask,
    tasks: uploadTasks,
  } = useFileUpload({
    uploadFunc: (file, onProgress, onError) => {
      uploader.addFile(
        path,
        file,
        (progress) => {
          onProgress(progress);
          if (progress.percent === 1) {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEY, path],
            });
          }
        },
        onError,
      );
    },
    abortFunc: (file) => {
      uploader.abortFile(file);
    },
  });

  const task = useMemo(() => {
    return {
      uploads: uploadTasks,
    };
  }, [uploadTasks]);

  const taskTitle = useMemo(() => {
    return open === "upload-file" ? "上传队列" : "离线下载";
  }, [open]);

  // Spring animation for the container
  const containerSpring = useSpring({
    width: mini ? "60px" : isMobile ? `${windowWidth}px` : "600px",
    height: mini ? "60px" : isMobile ? `${windowHeight}px` : "500px",
    borderRadius: mini ? "30px" : isMobile ? "0px" : "12px",
    right: mini ? "16px" : isMobile ? "0px" : "16px",
    bottom: mini ? "16px" : isMobile ? "0px" : "16px",
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0px) scale(1)" : "translateY(120%) scale(1)",
    pointerEvents: (open ? "auto" : "none") as "auto" | "none",
    config: { ...config.stiff, tension: 280, friction: 30 },
  });

  // Spring for content opacity
  const contentSpring = useSpring({
    opacity: mini ? 0 : 1,
    pointerEvents: (mini ? "none" : "auto") as "auto" | "none",
    config: { duration: 200 },
  });

  // Spring for mini indicator opacity
  const miniSpring = useSpring({
    opacity: mini ? 1 : 0,
    pointerEvents: (mini ? "auto" : "none") as "auto" | "none",
    config: { duration: 200 },
  });

  // Spring for overlay opacity
  const overlaySpring = useSpring({
    opacity: open && !mini ? 1 : 0,
    pointerEvents: (open && !mini ? "auto" : "none") as "auto" | "none",
    config: { duration: 200 },
  });

  const inProgressCount = task.uploads.filter(
    (u) => u.status === "in_progress",
  ).length;

  const handleSetOpen = (open: DrawerType | null) => {
    setOpen(open);
    setMini(false);
  };
  return (
    <DrawerContext.Provider value={{ open, setOpen: handleSetOpen }}>
      <FileUploadContext.Provider
        value={{
          openFileDialog: () => {
            openFileDialog();
            setOpen("upload-file");
          },
        }}
      >
        {children}

        {/* Overlay */}
        <animated.div
          style={overlaySpring}
          className="fixed inset-0 bg-black/10 backdrop-blur-xs z-40"
          onClick={() => {
            if (task.uploads.length === 0) {
              setOpen(null);
            } else {
              setMini(true);
            }
          }}
        />

        {/* Fixed Container */}
        <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
          <animated.div
            style={{
              ...containerSpring,
              position: "absolute",
              overflow: "hidden",
            }}
            className="bg-background border shadow-xl pointer-events-auto"
          >
            {/* Expanded Content */}
            <animated.div
              style={contentSpring}
              className="absolute inset-0 flex flex-col w-full h-full"
            >
              <div className="flex items-center justify-between bg-muted/50 p-3 border-b">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-background/80"
                    onClick={() => setOpen(null)}
                  >
                    <XIcon className="size-4" />
                  </Button>
                  <span className="font-medium text-sm">{taskTitle}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full -ml-1"
                      >
                        <ChevronDownIcon className="size-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuRadioGroup
                        value={open ?? "upload-file"}
                        onValueChange={(value) => setOpen(value as DrawerType)}
                      >
                        <DropdownMenuRadioItem value="upload-file">
                          上传队列
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="remote-download">
                          离线下载
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={cleanTasks}
                  >
                    <BrushCleaning />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={openFileDialog}
                  >
                    <Plus className="size-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setMini(true)}
                  >
                    <Minimize2 className="size-4" />
                  </Button>
                </div>
              </div>

              {task.uploads.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <PackageOpen className="size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">暂无上传任务</p>
                </div>
              )}

              <ScrollArea className="flex-1">
                {task.uploads.map((upload, index) => (
                  <div
                    key={`${upload.file.name}-${index}`}
                    className="flex items-center justify-between p-3 hover:bg-muted/50 group border-b border-border/50 last:border-0 relative"
                  >
                    {upload.status === "in_progress" && (
                      <div
                        className="absolute bottom-0 left-0 top-0 bg-primary/5 pointer-events-none transition-all duration-100"
                        style={{
                          width: `${(upload.uploaded / upload.file.size) * 100}%`,
                        }}
                      />
                    )}
                    <div className="flex items-center gap-3 relative z-10">
                      <div className="w-8 h-8 flex items-center justify-center rounded bg-muted">
                        <FileIcon
                          fileInfo={{
                            fileType: "file" as FileType,
                            name: upload.file.name,
                          }}
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm font-medium leading-none">
                          {upload.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {upload.status === "in_progress" && (
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(upload.speed)}/s，已上传
                              {formatFileSize(upload.uploaded)}，共
                              {formatFileSize(upload.file.size)}
                            </span>
                          )}
                          {upload.status === "completed" && (
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              完成
                            </span>
                          )}
                          {upload.status === "failed" && (
                            <span className="text-xs text-red-500">失败</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeTask(upload.file)}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </ScrollArea>
            </animated.div>

            {/* Collapsed Content (Mini) */}
            <animated.div
              style={miniSpring}
              className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors"
              onClick={() => setMini(false)}
            >
              <div className="relative">
                {inProgressCount > 0 ? (
                  <div className="relative flex items-center justify-center">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="absolute text-[10px] font-bold">
                      {inProgressCount}
                    </span>
                  </div>
                ) : (
                  <div className="bg-primary text-primary-foreground rounded-full p-2">
                    <Maximize2 className="size-5" />
                  </div>
                )}
              </div>
            </animated.div>
          </animated.div>
        </div>
      </FileUploadContext.Provider>
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload image file"
        tabIndex={-1}
      />
    </DrawerContext.Provider>
  );
}

type DrawerType = "upload-file" | "remote-download";

const DrawerContext = createContext<{
  open: DrawerType | null;
  setOpen: (open: DrawerType | null) => void;
}>({
  open: null,
  setOpen: () => {},
});

const FileUploadContext = createContext<{
  openFileDialog: () => void;
}>({
  openFileDialog: () => {},
});
