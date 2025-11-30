import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface MenuSeparator {
  type: "separator";
}

export interface MenuListProps {
  type: "context" | "dropdown";
  items: (MenuItem | MenuSeparator)[];
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

function isSeparator(item: MenuItem | MenuSeparator): item is MenuSeparator {
  return "type" in item && item.type === "separator";
}

export function MenuList({
  type,
  items,
  children,
  className,
  onClick,
}: MenuListProps) {
  if (type === "context") {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild onClick={onClick} className={className}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          {items.map((item, index) => {
            if (isSeparator(item)) {
              return <ContextMenuSeparator key={index} />;
            }
            return (
              <ContextMenuItem
                key={item.label}
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick();
                }}
              >
                {item.icon}
                {item.label}
              </ContextMenuItem>
            );
          })}
        </ContextMenuContent>
      </ContextMenu>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {items.map((item, index) => {
          if (isSeparator(item)) {
            return <DropdownMenuSeparator key={index} />;
          }
          return (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
