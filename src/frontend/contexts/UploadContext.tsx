import { type ReactNode, useCallback, useState } from "react";
import {
  abortChunkedUpload,
  createChunkedUploadSession,
  shouldUseChunkedUpload,
  startChunkedUpload,
} from "../api/chunkedUpload";
import type { UploadResponse } from "../api/upload";
import { uploadFiles, validateFile } from "../api/upload";
import type { UploadContextType, UploadItem } from "./UploadContextDefinition";
import { UploadContext } from "./UploadContextDefinition";

interface UploadProviderProps {
  children: ReactNode;
}

export function UploadProvider({ children }: UploadProviderProps) {
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [onUploadComplete, setOnUploadComplete] = useState<
    ((results: UploadResponse[]) => void) | undefined
  >();

  const addFiles = useCallback(
    (files: File[], _targetPath?: string, maxSizeMB?: number) => {
      setGlobalError(null);

      const newItems: UploadItem[] = [];

      for (const file of files) {
        const validation = validateFile(file, maxSizeMB);
        const isChunked = shouldUseChunkedUpload(file);
        const item: UploadItem = {
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          status: validation.valid ? "pending" : "error",
          progress: 0,
          error: validation.error,
          isChunked,
        };
        newItems.push(item);
      }

      setUploadItems((prev) => [...prev, ...newItems]);
    },
    [],
  );

  const removeFile = useCallback((id: string) => {
    setUploadItems((prev) => {
      const item = prev.find((item) => item.id === id);
      if (item?.chunkedUpload && item.status === "uploading") {
        abortChunkedUpload(item.chunkedUpload);
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const cancelUpload = useCallback((id: string) => {
    setUploadItems((prev) =>
      prev.map((item) => {
        if (item.id === id && item.status === "uploading") {
          if (item.chunkedUpload) {
            abortChunkedUpload(item.chunkedUpload);
          }
          return { ...item, status: "cancelled" as const };
        }
        return item;
      }),
    );
  }, []);

  const startUpload = useCallback(
    async (targetPath?: string) => {
      const validItems = uploadItems.filter(
        (item) => item.status === "pending",
      );
      if (validItems.length === 0) return;

      setIsUploading(true);
      setGlobalError(null);

      try {
        const results: UploadResponse[] = [];

        // Process files sequentially to avoid overwhelming the server
        for (const item of validItems) {
          // Update status to uploading
          setUploadItems((prev) =>
            prev.map((prevItem) =>
              prevItem.id === item.id
                ? { ...prevItem, status: "uploading" as const }
                : prevItem,
            ),
          );

          try {
            let result: UploadResponse;

            if (item.isChunked) {
              // Use chunked upload for large files
              const session = createChunkedUploadSession(item.file, {
                targetPath,
                onProgress: (progress) => {
                  setUploadItems((prev) =>
                    prev.map((prevItem) =>
                      prevItem.id === item.id
                        ? {
                            ...prevItem,
                            progress: progress.progress,
                            uploadProgress: progress,
                          }
                        : prevItem,
                    ),
                  );
                },
                onError: (error) => {
                  setUploadItems((prev) =>
                    prev.map((prevItem) =>
                      prevItem.id === item.id
                        ? {
                            ...prevItem,
                            status: "error" as const,
                            error: error.message,
                          }
                        : prevItem,
                    ),
                  );
                },
                onComplete: (uploadResult) => {
                  setUploadItems((prev) =>
                    prev.map((prevItem) =>
                      prevItem.id === item.id
                        ? {
                            ...prevItem,
                            status: "completed" as const,
                            progress: 100,
                            result: uploadResult,
                          }
                        : prevItem,
                    ),
                  );
                },
              });

              // Store the session for potential cancellation
              setUploadItems((prev) =>
                prev.map((prevItem) =>
                  prevItem.id === item.id
                    ? { ...prevItem, chunkedUpload: session }
                    : prevItem,
                ),
              );

              result = await new Promise<UploadResponse>((resolve, reject) => {
                // Store original callbacks
                const originalOnComplete = session.onComplete;
                const originalOnError = session.onError;

                // Set promise resolution callbacks that also trigger original callbacks
                session.onComplete = (uploadResult) => {
                  originalOnComplete?.(uploadResult);
                  resolve(uploadResult);
                };
                session.onError = (error) => {
                  originalOnError?.(error);
                  reject(error);
                };

                startChunkedUpload(session);
              });
            } else {
              // Use simple upload for small files
              const uploadResult = await uploadFiles(
                [item.file],
                targetPath,
                (_, progress) => {
                  setUploadItems((prev) =>
                    prev.map((prevItem) =>
                      prevItem.id === item.id
                        ? { ...prevItem, progress }
                        : prevItem,
                    ),
                  );
                },
              );

              result = uploadResult[0];

              // Update status to completed
              setUploadItems((prev) =>
                prev.map((prevItem) =>
                  prevItem.id === item.id
                    ? {
                        ...prevItem,
                        status: "completed" as const,
                        progress: 100,
                        result,
                      }
                    : prevItem,
                ),
              );
            }

            results.push(result);
          } catch (error) {
            // Error handling is done in the respective upload methods
            console.error(`文件 ${item.file.name} 上传失败:`, error);
          }
        }

        onUploadComplete?.(results.filter(Boolean));
      } catch (error) {
        setGlobalError(error instanceof Error ? error.message : "上传失败");
      } finally {
        setIsUploading(false);
      }
    },
    [uploadItems, onUploadComplete],
  );

  const clearCompleted = useCallback(() => {
    setUploadItems((prev) =>
      prev.filter((item) => item.status !== "completed"),
    );
  }, []);

  const clearAll = useCallback(() => {
    // Cancel any ongoing uploads before clearing
    for (const item of uploadItems) {
      if (item.chunkedUpload && item.status === "uploading") {
        abortChunkedUpload(item.chunkedUpload);
      }
    }
    setUploadItems([]);
    setGlobalError(null);
  }, [uploadItems]);

  const getUploadStats = useCallback(() => {
    const stats = {
      total: uploadItems.length,
      pending: 0,
      uploading: 0,
      completed: 0,
      error: 0,
      cancelled: 0,
    };

    for (const item of uploadItems) {
      stats[item.status]++;
    }

    return stats;
  }, [uploadItems]);

  const value: UploadContextType = {
    uploadItems,
    isUploading,
    globalError,
    isDrawerOpen,
    setIsDrawerOpen,
    addFiles,
    removeFile,
    cancelUpload,
    startUpload,
    clearCompleted,
    clearAll,
    getUploadStats,
    onUploadComplete,
    setOnUploadComplete: useCallback((callback) => {
      setOnUploadComplete(() => callback);
    }, []),
  };

  return (
    <UploadContext.Provider value={value}>{children}</UploadContext.Provider>
  );
}
