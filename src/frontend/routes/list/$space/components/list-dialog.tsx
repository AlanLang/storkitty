import { FileType, type FileInfo } from "@/api/file/list";
import { FileCreateDialog } from "./file-create-dialog";
import { FileDeleteDialog } from "./file-delete-dialog";
import { FileOpenDialog } from "./file-open/file-open-dialog";
import { FileRenameDialog } from "./file-rename-dialog";
import { FolderCreateDialog } from "./folder-create-dialog";
import { FolderDeleteDialog } from "./folder-delete-dialog";
import { FolderRenameDialog } from "./folder-rename-dialog";
import { RemoteDownloadDialog } from "./remote-download-dialog";

export interface ListDialogProps {
  path: string;
  open: {
    type:
      | "delete"
      | "rename"
      | "create-folder"
      | "create-file"
      | "edit"
      | "remote-download";
    file: FileInfo | null;
    defaultName?: string;
  } | null;
  onCancel: () => void;
  onFinish: () => void;
}

export function ListDialog({
  path,
  open,
  onCancel,
  onFinish,
}: ListDialogProps) {
  const file = open?.file;

  return (
    <>
      <FolderDeleteDialog
        path={path}
        name={file?.name ?? ""}
        count={file?.items ?? 0}
        isOpen={open?.type === "delete" && file?.fileType === FileType.Folder}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FileDeleteDialog
        path={path}
        name={file?.name ?? ""}
        size={file?.size ?? undefined}
        isOpen={open?.type === "delete" && file?.fileType === FileType.File}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FileRenameDialog
        path={path}
        name={file?.name ?? ""}
        isOpen={open?.type === "rename" && file?.fileType === FileType.File}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FolderRenameDialog
        path={path}
        name={file?.name ?? ""}
        isOpen={open?.type === "rename" && file?.fileType === FileType.Folder}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FolderCreateDialog
        path={path}
        isOpen={open?.type === "create-folder"}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FileCreateDialog
        path={path}
        isOpen={open?.type === "create-file"}
        defaultName={open?.defaultName}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <FileOpenDialog
        path={path}
        fileName={file?.name ?? ""}
        isOpen={open?.type === "edit" && file?.fileType === FileType.File}
        onCancel={onCancel}
        onFinish={onFinish}
      />

      <RemoteDownloadDialog
        path={path}
        isOpen={open?.type === "remote-download"}
        onCancel={onCancel}
        onFinish={onFinish}
      />
    </>
  );
}
