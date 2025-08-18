import { type ReactNode, useState } from "react";
import type { ClipboardItem, ClipboardState, FileInfo } from "../types/files";
import {
  ClipboardContext,
  type ClipboardContextType,
} from "./ClipboardContextDefinition";

interface ClipboardProviderProps {
  children: ReactNode;
}

export function ClipboardProvider({ children }: ClipboardProviderProps) {
  const [clipboardState, setClipboardState] = useState<ClipboardState>({
    item: null,
  });

  const setClipboardItem = (
    file: FileInfo,
    operation: "move" | "copy",
    directoryId: string,
    sourcePath: string,
  ) => {
    const clipboardItem: ClipboardItem = {
      file,
      operation,
      directoryId,
      sourcePath,
    };

    setClipboardState({ item: clipboardItem });
  };

  const clearClipboard = () => {
    setClipboardState({ item: null });
  };

  const hasClipboardItem = (): boolean => {
    return clipboardState.item !== null;
  };

  const canPasteToDirectory = (targetDirectoryId: string): boolean => {
    if (!clipboardState.item) return false;

    // 只允许在同一目录内进行移动和复制
    return clipboardState.item.directoryId === targetDirectoryId;
  };

  const value: ClipboardContextType = {
    item: clipboardState.item,
    setClipboardItem,
    clearClipboard,
    hasClipboardItem,
    canPasteToDirectory,
  };

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  );
}
