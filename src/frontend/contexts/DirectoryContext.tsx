import { type ReactNode, useState } from "react";
import { DirectoryContext } from "./DirectoryContextDefinition";

interface DirectoryProviderProps {
  children: ReactNode;
  initialDirectoryId: string;
}

export function DirectoryProvider({
  children,
  initialDirectoryId,
}: DirectoryProviderProps) {
  const [selectedDirectoryId, setSelectedDirectoryId] =
    useState<string>(initialDirectoryId);

  return (
    <DirectoryContext.Provider
      value={{ selectedDirectoryId, setSelectedDirectoryId }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}
