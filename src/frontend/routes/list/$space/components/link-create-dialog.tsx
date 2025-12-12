import { createLink, type CreateLinkDto, createLinkSchema } from "@/api/link";
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
import { Loader2, Star } from "lucide-react";
import { useForm } from "react-hook-form";
import { DIALOG_CONTENT_CLASSNAME } from "./constant";

interface LinkCreateDialogProps {
  path: string;
  isOpen: boolean;
  onCancel: () => void;
  onFinish: () => void;
}

export function LinkCreateDialog({
  path,
  isOpen,
  onCancel,
  onFinish,
}: LinkCreateDialogProps) {
  const form = useForm<CreateLinkDto>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      name: "",
      path: "",
      icon: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createLink,
    onSuccess: () => {
      onFinish();
    },
  });

  const handleConfirm = async () => {
    mutate({ name: form.getValues().name, path, icon: "" });
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
              <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-2 animate-in zoom-in-50 duration-300">
                <Star className="h-8 w-8 text-amber-500" />
              </div>

              <DialogHeader className="space-y-2">
                <DialogTitle className="text-xl font-semibold text-center">
                  收藏当前目录
                </DialogTitle>
                <DialogDescription className="text-center text-muted-foreground max-w-[280px] mx-auto">
                  将当前目录添加到收藏夹，方便快速访问
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
                        placeholder="请输入收藏名称"
                        autoFocus
                        disabled={isPending}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-lg bg-muted/50 p-3 text-left">
                  <p className="text-xs text-muted-foreground">
                    📁 当前路径：
                    <code className="text-foreground">{path || "/"}</code>
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
                className="w-full sm:w-1/2 gap-2 bg-amber-500 hover:bg-amber-600"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
                {isPending ? "收藏中..." : "添加收藏"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
