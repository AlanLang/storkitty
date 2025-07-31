import { createContext } from "react";

export interface DirectoryContextType {
  selectedDirectoryId: string;
  setSelectedDirectoryId: (directoryId: string) => void;
}

export const DirectoryContext = createContext<DirectoryContextType | undefined>(
  undefined,
);
