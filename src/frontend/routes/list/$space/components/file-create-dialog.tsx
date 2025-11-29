import {
  createFile,
  type CreateFileDto,
  createFileSchema,
} from "@/api/file/create";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { FilePlus, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface FileCreateDialogProps {
  path: string;
  isOpen: boolean;
  defaultName?: string;
  onCancel: () => void;
  onFinish: () => void;
}

export function FileCreateDialog({
  path,
  isOpen,
  defaultName = "新文件.txt",
  onCancel,
  onFinish,
}: FileCreateDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const form = useForm<CreateFileDto>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      name: defaultName,
      path: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({ name: defaultName, path });
      // Wait for the dialog animation/render
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const name = defaultName;
          const lastDotIndex = name.lastIndexOf(".");
          if (lastDotIndex !== -1) {
            inputRef.current.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 100);
    }
  }, [isOpen, path, form, defaultName]);

  const { mutate, isPending } = useMutation({
    mutationFn: createFile,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleConfirm = async () => {
    mutate({ name: form.getValues().name, path });
  };

  const handleClose = () => {
    if (isPending) return;
    onCancel();
  };

  const canCreate = form.formState.isValid && !isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(DIALOG_CONTENT_CLASSNAME)}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleConfirm)}
            className="flex flex-col h-full"
          >
            <div className="p-6 flex flex-col items-center text-center space-y-4 pt-8 min-w-0">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
                <FilePlus className="h-8 w-8 text-primary" />
              </div>

              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-semibold text-center">
                  创建新文件
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
                  在当前位置创建一个新的目标类型的文件
                </DialogDescription>
              </DialogHeader>

              <div className="w-full mt-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Input
                        {...field}
                        ref={(e) => {
                          field.ref(e);
                          inputRef.current = e;
                        }}
                        placeholder="请输入文件名称"
                        disabled={isPending}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-muted/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">
                    💡 提示：文件名称不能包含特殊字符，且不能与系统保留名冲突
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/10 flex-col sm:flex-row gap-2 sm:gap-2 border-t mt-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="w-full sm:w-1/2"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!canCreate}
                className="w-full sm:w-1/2 gap-2"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FilePlus className="h-4 w-4" />
                )}
                {isPending ? "创建中..." : "创建文件"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
