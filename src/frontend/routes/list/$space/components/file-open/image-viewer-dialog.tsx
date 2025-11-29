import { getFileBlob } from "@/api/file/content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { FileOpenDialogProps } from "./type";

export function ImageViewerDialog({
  isOpen,
  onCancel,
  fileName,
  path,
}: FileOpenDialogProps) {
  const [imageUrl, setImageUrl] = useState<string>("");
  const filePath = `${path}/${fileName}`;

  const { data: blob, isLoading } = useQuery({
    queryKey: ["file", "blob", filePath],
    queryFn: () => getFileBlob(filePath),
    enabled: isOpen && !!path,
    staleTime: Infinity, // Cache the image blob
  });

  useEffect(() => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setImageUrl("");
  }, [blob]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-4xl w-auto h-auto max-h-[90vh] overflow-auto p-0 gap-0 bg-transparent border-none shadow-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{fileName}</DialogTitle>
        </DialogHeader>
        <div className="relative flex items-center justify-center min-h-[200px] min-w-[200px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Loading...
            </div>
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={fileName}
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-lg"
              style={{ display: isLoading ? "none" : "block" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
