import { createContext } from "react";
import type {
  ChunkedUploadProgress,
  ChunkedUploadSession,
} from "../api/chunkedUpload";
import type { UploadResponse } from "../api/upload";

export interface UploadItem {
  file: File;
  id: string;
  status: "pending" | "uploading" | "completed" | "error" | "cancelled";
  progress: number;
  error?: string;
  result?: UploadResponse;
  chunkedUpload?: ChunkedUploadSession;
  uploadProgress?: ChunkedUploadProgress;
  isChunked: boolean;
}

export interface UploadContextType {
  // Upload items state
  uploadItems: UploadItem[];
  isUploading: boolean;
  globalError: string | null;

  // Drawer state
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;

  // Upload operations
  addFiles: (files: File[], targetPath?: string, maxSizeMB?: number) => void;
  removeFile: (id: string) => void;
  cancelUpload: (id: string) => void;
  startUpload: (targetPath?: string, currentPath?: string) => Promise<void>;
  clearCompleted: () => void;
  clearAll: () => void;

  // Statistics
  getUploadStats: () => {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    error: number;
    cancelled: number;
  };

  // Callbacks
  onUploadComplete?: (results: UploadResponse[]) => void;
  setOnUploadComplete: (callback?: (results: UploadResponse[]) => void) => void;
}

export const UploadContext = createContext<UploadContextType | undefined>(
  undefined,
);
