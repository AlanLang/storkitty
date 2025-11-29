import { fileExtensions } from "../file-icon";
import { EditDialog } from "./edit-dialog";
import { ImageViewerDialog } from "./image-viewer-dialog";
import { TextFileEditDialog } from "./text-edit-dialog";
import type { FileOpenDialogProps } from "./type";

export function FileOpenDialog(props: FileOpenDialogProps) {
  const { fileName } = props;

  const isText =
    fileExtensions.text.some((extension) =>
      fileName.toLowerCase().endsWith(extension),
    ) ||
    fileExtensions.code.some((extension) =>
      fileName.toLowerCase().endsWith(extension),
    );

  const isImage = fileExtensions.image.some((extension) =>
    fileName.toLowerCase().endsWith(extension),
  );

  if (isText) {
    return <TextFileEditDialog {...props} />;
  }

  if (isImage) {
    return <ImageViewerDialog {...props} />;
  }

  return <EditDialog {...props} />;
}
