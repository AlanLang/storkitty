import {
  Cloud,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  Home,
  Image,
  Video,
} from "lucide-react";

// 格式化文件大小
export function formatFileSize(bytes: number): string {
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
export function formatStorageSpace(bytes: number): string {
  return formatFileSize(bytes);
}

// 根据文件扩展名获取图标
export function getFileIcon(fileName: string, fileType: string) {
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

// 根据图标名称获取图标组件
export function getDirectoryIcon(iconName: string) {
  switch (iconName) {
    case "folder":
      return Folder;
    case "file-text":
      return FileText;
    case "image":
      return Image;
    case "video":
      return Video;
    case "cloud":
      return Cloud;
    case "home":
      return Home;
    default:
      return Folder;
  }
}

// 根据文件类型获取图标颜色
export function getFileIconColor(fileName: string, fileType: string) {
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

// Helper function to get the effective directory ID
export function getEffectiveDirectoryId(
  requestedDirectoryId: string | undefined,
  directoriesData:
    | { directories: Array<{ id: string; default?: boolean }> }
    | undefined,
): string | undefined {
  if (!directoriesData?.directories?.length) {
    return undefined;
  }

  // If a specific directory is requested, use it
  if (requestedDirectoryId) {
    return requestedDirectoryId;
  }

  // Find the default directory from config
  const defaultDirectory = directoriesData.directories.find(
    (dir) => dir.default,
  );
  if (defaultDirectory) {
    return defaultDirectory.id;
  }

  // If no default is set, use the first directory
  return directoriesData.directories[0].id;
}

// Helper function to validate directory exists
export function validateDirectoryId(
  directoryId: string | undefined,
  directoriesData: { directories: Array<{ id: string }> } | undefined,
): boolean {
  if (!directoryId || !directoriesData?.directories?.length) {
    return false;
  }
  return directoriesData.directories.some((dir) => dir.id === directoryId);
}
