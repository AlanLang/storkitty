import { Button } from "@/components/ui/button";
import { useFileUploadDialog } from "@/hooks/use-task";
import { FolderOpen, Upload } from "lucide-react";

export function FileListEmpty() {
  const { openFileDialog } = useFileUploadDialog();

  return (
    <div className="flex flex-col items-center justify-center py-16 h-full">
      <div className="w-24 h-24 flex items-center justify-center rounded-3xl bg-gradient-to-br from-muted/30 to-muted/50 mb-6">
        <FolderOpen className="h-12 w-12 text-muted-foreground/60" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">文件夹为空</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        此文件夹中还没有任何文件。上传一些文件来开始使用吧
      </p>
      <Button variant="outline" className="mt-4 gap-2" onClick={openFileDialog}>
        <Upload className="h-4 w-4" />
        上传文件
      </Button>
    </div>
  );
}
