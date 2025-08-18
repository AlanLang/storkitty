import { useCallback } from "react";
import { toast } from "sonner";
import type { FileInfo } from "../types/files";
import { useClipboard } from "./useClipboard";
import { useDirectory } from "./useDirectory";
import { useCopyFileMutation, useMoveFileMutation } from "./useFiles";

export function useClipboardOperations(currentPath?: string) {
  const {
    setClipboardItem,
    clearClipboard,
    item: clipboardItem,
  } = useClipboard();
  const { selectedDirectoryId } = useDirectory();
  const moveFileMutation = useMoveFileMutation();
  const copyFileMutation = useCopyFileMutation();

  // 处理移动点击
  const handleMoveClick = useCallback(
    (file: FileInfo) => {
      const sourcePath = currentPath
        ? `${currentPath}/${file.name}`
        : file.name;
      setClipboardItem(file, "move", selectedDirectoryId, sourcePath);
      toast.success(`已将 "${file.name}" 添加到剪贴板，准备移动`);
    },
    [currentPath, selectedDirectoryId, setClipboardItem],
  );

  // 处理复制点击
  const handleCopyClick = useCallback(
    (file: FileInfo) => {
      const sourcePath = currentPath
        ? `${currentPath}/${file.name}`
        : file.name;
      setClipboardItem(file, "copy", selectedDirectoryId, sourcePath);
      toast.success(`已将 "${file.name}" 添加到剪贴板，准备复制`);
    },
    [currentPath, selectedDirectoryId, setClipboardItem],
  );

  // 处理粘贴操作
  const handlePaste = useCallback(async () => {
    if (!clipboardItem) return;

    try {
      // 构建目标路径
      const targetFileName = clipboardItem.file.name;
      const targetPath = currentPath
        ? `${currentPath}/${targetFileName}`
        : targetFileName;

      if (clipboardItem.operation === "move") {
        await moveFileMutation.mutateAsync({
          directoryId: selectedDirectoryId,
          sourceFilePath: clipboardItem.sourcePath,
          targetFilePath: targetPath,
        });
        toast.success(`"${clipboardItem.file.name}" 移动成功`);
      } else {
        await copyFileMutation.mutateAsync({
          directoryId: selectedDirectoryId,
          sourceFilePath: clipboardItem.sourcePath,
          targetFilePath: targetPath,
        });
        toast.success(`"${clipboardItem.file.name}" 复制成功`);
      }

      // 操作成功后清空剪贴板
      clearClipboard();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`操作失败: ${error.message}`);
      } else {
        toast.error(
          `${clipboardItem.operation === "move" ? "移动" : "复制"}失败`,
        );
      }
    }
  }, [
    clipboardItem,
    clearClipboard,
    moveFileMutation,
    copyFileMutation,
    selectedDirectoryId,
    currentPath,
  ]);

  return {
    handleMoveClick,
    handleCopyClick,
    handlePaste,
    isPasting: moveFileMutation.isPending || copyFileMutation.isPending,
  };
}
