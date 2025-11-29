import type { FileInfo } from "@/api/file/list";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Trash2 } from "lucide-react";

interface FileContextProps {
  file: FileInfo;
}

export function FileContextMenu({
  children,
  file,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger> &
  FileContextProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild {...props}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        <ContextMenuItem asChild>
          <div className="cursor-pointer">
            <Trash2 className="size-4" />
            删除
          </div>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
