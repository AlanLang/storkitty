import { useContext } from "react";
import { DirectoryContext } from "../contexts/DirectoryContextDefinition";

export function useDirectoryContext() {
  const context = useContext(DirectoryContext);
  if (context === undefined) {
    throw new Error(
      "useDirectoryContext must be used within a DirectoryProvider",
    );
  }
  return context;
}
