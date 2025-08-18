import { createContext } from "react";
import type { ClipboardState, FileInfo } from "../types/files";

export interface ClipboardContextType extends ClipboardState {
  // 设置剪贴板项目（复制或移动）
  setClipboardItem: (
    file: FileInfo,
    operation: "move" | "copy",
    directoryId: string,
    sourcePath: string,
  ) => void;

  // 清空剪贴板
  clearClipboard: () => void;

  // 检查是否有剪贴板项目
  hasClipboardItem: () => boolean;

  // 检查是否可以粘贴到当前目录（防止跨目录操作）
  canPasteToDirectory: (targetDirectoryId: string) => boolean;
}

export const ClipboardContext = createContext<ClipboardContextType | undefined>(
  undefined,
);
