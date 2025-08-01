import { type ReactNode, useCallback, useEffect, useState } from "react";
import { DirectoryContext } from "./DirectoryContextDefinition";

interface DirectoryProviderProps {
  children: ReactNode;
  initialDirectoryId: string;
}

const STORAGE_KEY = "storkitty_selected_directory";

export function DirectoryProvider({
  children,
  initialDirectoryId,
}: DirectoryProviderProps) {
  // 从 localStorage 读取已选择的目录，如果没有则使用 initialDirectoryId
  const [selectedDirectoryId, setSelectedDirectoryIdState] = useState<string>(
    () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored || initialDirectoryId;
      }
      return initialDirectoryId;
    },
  );

  // 当选择的目录改变时，保存到 localStorage
  const setSelectedDirectoryId = useCallback((directoryId: string) => {
    setSelectedDirectoryIdState(directoryId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, directoryId);
    }
  }, []);

  // 如果 initialDirectoryId 改变了，且当前没有存储的选择，更新为新的初始值
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored && selectedDirectoryId !== initialDirectoryId) {
        setSelectedDirectoryId(initialDirectoryId);
      }
    }
  }, [initialDirectoryId, selectedDirectoryId, setSelectedDirectoryId]);

  return (
    <DirectoryContext.Provider
      value={{ selectedDirectoryId, setSelectedDirectoryId }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}
