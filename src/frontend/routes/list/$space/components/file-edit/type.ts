export interface FileEditDialogProps {
  path: string;
  fileName: string;
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}
