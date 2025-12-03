import { fileExtensions } from "../file-icon";
import { EditDialog } from "./edit-dialog";
import { ExcalidrawEditDialog } from "./excalidraw-edit-dialog";
import { TextFileEditDialog } from "./text-edit-dialog";
import type { FileEditDialogProps } from "./type";

export function FileEditDialog(props: FileEditDialogProps) {
  const { fileName } = props;

  const isText =
    fileExtensions.text.some((extension) =>
      fileName.toLowerCase().endsWith(extension),
    ) ||
    fileExtensions.code.some((extension) =>
      fileName.toLowerCase().endsWith(extension),
    );

  const isExcalidraw = fileName.toLowerCase().endsWith(".excalidraw");
  if (isExcalidraw) {
    return <ExcalidrawEditDialog {...props} />;
  }

  if (isText) {
    return <TextFileEditDialog {...props} />;
  }

  return <EditDialog {...props} />;
}
