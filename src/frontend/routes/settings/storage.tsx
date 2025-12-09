import type { Storage } from "@/api/storage";
import { getStorageList } from "@/api/storage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { StorageEdit } from "./components/storage-edit";
import { StorageItem } from "./components/storage-item";

export const Route = createFileRoute("/settings/storage")({
  component: RouteComponent,
});

function RouteComponent() {
  const [editingStorage, setEditingStorage] = useState<Storage | "new" | null>(
    null,
  );

  const {
    data: storageList = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["storageList"],
    queryFn: getStorageList,
  });

  if (editingStorage !== null) {
    return (
      <StorageEdit
        storage={editingStorage === "new" ? null : editingStorage}
        onClose={() => setEditingStorage(null)}
      />
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">存储管理</h1>
          <p className="text-muted-foreground mt-2">
            管理您的存储空间，配置文件上传和访问规则
          </p>
        </div>
        <Button onClick={() => setEditingStorage("new")}>
          <PlusIcon className="size-4" />
          添加存储
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
            >
              <Skeleton className="size-8 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">加载失败</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || "无法获取存储列表"}
          </p>
        </div>
      ) : storageList.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <PlusIcon className="size-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground">暂无存储</h3>
          <p className="text-sm text-muted-foreground mt-1">
            点击上方按钮添加您的第一个存储空间
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {storageList.map((item) => (
            <StorageItem
              key={item.id}
              storage={item}
              onClick={() => setEditingStorage(item)}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {storageList.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <span>
            共 {storageList.length} 个存储空间，
            {storageList.filter((s) => !s.disabled).length} 个已启用
          </span>
        </div>
      )}
    </div>
  );
}
