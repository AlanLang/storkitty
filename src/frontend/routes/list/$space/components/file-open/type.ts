export interface FileOpenDialogProps {
  path: string;
  fileName: string;
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}
