import { useContext } from "react";
import { DirectoryContext } from "../contexts/DirectoryContextDefinition";

export function useDirectory() {
  const context = useContext(DirectoryContext);
  if (context === undefined) {
    throw new Error("useDirectory must be used within a DirectoryProvider");
  }
  return context;
}
