import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLongPress } from "@uidotdev/usehooks";
import { useState } from "react";

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
  title?: string;
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
  title = "操作",
}: MenuListProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const longPressProps = useLongPress(
    () => {
      setOpen(true);
    },
    {
      threshold: 500,
    }
  );

  const renderSheetContent = () => (
    <SheetContent side="bottom">
      <SheetHeader className="text-left">
        <SheetTitle>{title}</SheetTitle>
      </SheetHeader>
      <div className="flex flex-col gap-0 mt-2">
        {items.map((item, index) => {
          if (isSeparator(item)) {
            return <div key={index} className="h-px bg-border my-1" />;
          }
          return (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start w-full h-11 text-base font-normal"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </SheetContent>
  );

  if (isMobile) {
    if (type === "context") {
      return (
        <Sheet open={open} onOpenChange={setOpen}>
          <div
            {...longPressProps}
            className={className}
            onClick={onClick}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {children}
          </div>
          {renderSheetContent()}
        </Sheet>
      );
    }

    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger onClick={onClick} asChild>
          {children}
        </SheetTrigger>
        {renderSheetContent()}
      </Sheet>
    );
  }

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
