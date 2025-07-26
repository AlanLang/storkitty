import { useContext } from "react";
import { UploadContext } from "../contexts/UploadContextDefinition";

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload 必须在 UploadProvider 内使用");
  }
  return context;
}
