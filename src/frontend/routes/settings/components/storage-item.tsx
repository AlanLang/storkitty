import type { Storage } from "@/api/storage";
import { cn } from "@/lib/utils";
import { HardDriveIcon } from "lucide-react";

interface StorageItemProps {
  storage: Storage;
  onClick: () => void;
}

export function StorageItem({ storage, onClick }: StorageItemProps) {
  const iconElement = storage.icon ? (
    <span className="text-lg">{storage.icon}</span>
  ) : (
    <HardDriveIcon className="size-4 text-muted-foreground" />
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-all hover:shadow-md text-left w-full cursor-pointer",
        storage.disabled && "opacity-60",
      )}
    >
      {/* Icon */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {iconElement}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-medium">{storage.name}</h3>
          <span className="shrink-0 rounded bg-primary/10 px-1 py-0.5 text-[10px] text-primary">
            {storage.kind === "local" ? "本地" : storage.kind}
          </span>
          {storage.disabled && (
            <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[10px] text-muted-foreground">
              已禁用
            </span>
          )}
        </div>
        <p
          className="truncate text-xs text-muted-foreground mt-0.5"
          title={storage.localPath}
        >
          /{storage.path}
        </p>
      </div>
    </button>
  );
}
