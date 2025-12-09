import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTaskDrawer } from "@/hooks/use-task";

interface ListContextMenuProps {
  children: React.ReactNode;
  onUpload: () => void;
  onCreateFolder: () => void;
  onCreateFile: (defaultName?: string) => void;
  onRemoteDownload: () => void;
  onRefresh: () => void;
  disabled: boolean;
}
export function ListContextMenu({
  children,
  disabled,
  ...props
}: ListContextMenuProps) {
  const { open, setOpen } = useTaskDrawer();
  if (disabled) {
    return children;
  }
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem inset onClick={props.onUpload}>
          上传文件
          <ContextMenuShortcut>⌘u</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={props.onCreateFolder}>
          新建文件夹
          <ContextMenuShortcut>⌘m</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger inset>新建</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-44">
            <ContextMenuItem onClick={() => props.onCreateFile("新文件.txt")}>
              文本(.txt)
              <ContextMenuShortcut>⌘n</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => props.onCreateFile("新文件.md")}>
              Markdown(.md)
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => props.onCreateFile("新文件.excalidraw")}
            >
              Excalidraw(.excalidraw)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => props.onCreateFile("新文件.d2")}>
              D2(.d2)
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={props.onRemoteDownload}>
          离线下载
          <ContextMenuShortcut>⌘d</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          checked={open === "upload-file"}
          onClick={() => setOpen("upload-file")}
        >
          文件上传指示器
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={open === "remote-download"}
          onClick={() => setOpen("remote-download")}
        >
          离线下载指示器
        </ContextMenuCheckboxItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset>
          多选
          <ContextMenuShortcut>⌘e</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem inset>
          全选
          <ContextMenuShortcut>⌘a</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem inset onClick={props.onRefresh}>
          刷新
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
