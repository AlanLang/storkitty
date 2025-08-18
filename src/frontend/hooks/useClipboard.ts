import { useContext } from "react";
import {
  ClipboardContext,
  type ClipboardContextType,
} from "../contexts/ClipboardContextDefinition";

export function useClipboard(): ClipboardContextType {
  const context = useContext(ClipboardContext);
  if (context === undefined) {
    throw new Error("useClipboard must be used within a ClipboardProvider");
  }
  return context;
}
