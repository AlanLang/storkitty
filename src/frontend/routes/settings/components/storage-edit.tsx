import type {
  CreateStorageDto,
  Storage,
  UpdateStorageDto,
} from "@/api/storage";
import { createStorage, deleteStorage, updateStorage } from "@/api/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, Loader2Icon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface StorageEditProps {
  storage: Storage | null;
  onClose: () => void;
}

interface FormValues {
  name: string;
  path: string;
  localPath: string;
  icon: string;
  kind: string;
  maxFileSize: number;
  allowExtensions: string;
  blockExtensions: string;
}

export function StorageEdit({ storage, onClose }: StorageEditProps) {
  const isEditing = storage !== null;
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      name: storage?.name ?? "",
      path: storage?.path ?? "",
      localPath: storage?.localPath ?? "",
      icon: storage?.icon ?? "",
      kind: storage?.kind ?? "local",
      maxFileSize: storage?.maxFileSize ?? 0,
      allowExtensions: storage?.allowExtensions ?? "",
      blockExtensions: storage?.blockExtensions ?? "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateStorageDto) => createStorage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageList"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStorageDto) => {
      if (!storage) throw new Error("Storage not found");
      return updateStorage(storage.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageList"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!storage) throw new Error("Storage not found");
      return deleteStorage(storage.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storageList"] });
      onClose();
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateMutation.mutate({
        name: values.name,
        path: values.path,
        localPath: values.localPath,
        icon: values.icon,
        kind: values.kind,
      });
    } else {
      createMutation.mutate({
        name: values.name,
        path: values.path,
        localPath: values.localPath,
        icon: values.icon,
        kind: values.kind,
        maxFileSize: values.maxFileSize,
        allowExtensions: values.allowExtensions,
        blockExtensions: values.blockExtensions,
        sortIndex: 0,
      });
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          返回列表
        </button>
        <h1 className="text-3xl font-bold">
          {isEditing ? "编辑存储" : "添加存储"}
        </h1>
        <p className="text-muted-foreground mt-2">
          {isEditing ? "修改存储空间的配置信息" : "创建一个新的存储空间"}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "请输入存储名称" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>名称</FormLabel>
                <FormControl>
                  <Input placeholder="我的存储" {...field} />
                </FormControl>
                <FormDescription>存储空间的显示名称</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="path"
            rules={{
              required: "请输入访问路径",
              pattern: {
                value: /^[a-zA-Z0-9_-]+$/,
                message: "路径只能包含英文字母、数字、下划线和连字符",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>访问路径</FormLabel>
                <FormControl>
                  <Input placeholder="my-storage" {...field} />
                </FormControl>
                <FormDescription>
                  用于 URL 访问的路径，例如：/list/my-storage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="localPath"
            rules={{ required: "请输入本地路径" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>本地路径</FormLabel>
                <FormControl>
                  <Input placeholder="/path/to/storage" {...field} />
                </FormControl>
                <FormDescription>服务器上存储文件的实际路径</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEditing && (
            <>
              <FormField
                control={form.control}
                name="maxFileSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最大文件大小 (字节)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      0 表示不限制，例如 104857600 = 100MB
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowExtensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>允许的扩展名</FormLabel>
                    <FormControl>
                      <Input placeholder="jpg,png,pdf" {...field} />
                    </FormControl>
                    <FormDescription>
                      用逗号分隔，留空表示允许所有类型
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blockExtensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>禁止的扩展名</FormLabel>
                    <FormControl>
                      <Input placeholder="exe,bat,sh" {...field} />
                    </FormControl>
                    <FormDescription>
                      用逗号分隔，这些类型的文件将被拒绝上传
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Error display */}
          {(createMutation.error || updateMutation.error) && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {(createMutation.error || updateMutation.error)?.message ||
                "操作失败，请重试"}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <TrashIcon className="size-4" />
                  删除存储
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2Icon className="size-4 animate-spin" />}
                {isEditing ? "保存更改" : "创建存储"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除存储「{storage?.name}
              」吗？此操作无法撤销，但不会删除实际的文件。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
