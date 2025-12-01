import { login, loginSchema, type LoginDto } from "@/api/auth/login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { useFormField } from "@/components/ui/form";
import { ThemeSwitch } from "@/components/ui/theme-switch-button";
import { useApp, useSetAppInfo } from "@/hooks/use-app";
import { token } from "@/lib/token";
import { cn } from "@/lib/utils";
import { animated, easings, useTransition } from "@react-spring/web";
import { useMutation } from "@tanstack/react-query";
import { FingerprintPattern, Loader } from "lucide-react";
import { toast } from "sonner";

function AnimatedFormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  const transition = useTransition(body, {
    from: { opacity: 0, height: 0, transform: "translateY(-10px)" },
    enter: { opacity: 1, height: 20, transform: "translateY(0px)" },
    leave: { opacity: 0, height: 0, transform: "translateY(-10px)" },
    config: { duration: 200, easing: easings.easeOutCubic },
  });

  return (
    <>
      {transition((style, item) =>
        item ? (
          <animated.p
            style={style}
            data-slot="form-message"
            id={formMessageId}
            className={cn("text-destructive text-sm font-medium", className)}
            {...props}
          >
            {item}
          </animated.p>
        ) : null,
      )}
    </>
  );
}

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const app = useApp();
  if (!app.initialed) {
    return <Navigate to="/setup" />;
  }
  return <LoginForm />;
}

function LoginForm() {
  const navigate = useNavigate();
  const setAppInfo = useSetAppInfo();

  const form = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAppInfo({
        user: {
          id: data.user.id,
          name: data.user.name,
          avatar: data.user.avatar,
          email: data.user.email,
        },
        storages: data.storages,
        loggedIn: true,
      });
      token.set(data.token);
      navigate({ to: "/" });
    },
    onError: async (error: any) => {
      const msg = (await error.response.text()) || "登录失败，请稍后重试";
      toast.error(msg);
      token.remove();
    },
  });

  const passkeyMutation = useMutation({
    mutationFn: async (email?: string) => {
      const { startPasskeyAuthentication, finishPasskeyAuthentication } =
        await import("@/api/auth/webauthn");
      const { credential, sessionId } = await startPasskeyAuthentication(email);
      return finishPasskeyAuthentication(credential, sessionId);
    },
    onSuccess: (data) => {
      setAppInfo({
        user: {
          id: data.user.id,
          name: data.user.name,
          avatar: data.user.avatar,
          email: data.user.email,
        },
        storages: data.storages,
        loggedIn: true,
      });
      token.set(data.token);
      navigate({ to: "/" });
    },
    onError: (error: any) => {
      toast.error(error.message || "通行密钥登录失败");
    },
  });

  function onSubmit(values: LoginDto) {
    mutate(values);
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl title">欢迎回来</CardTitle>
          <CardDescription>请登录您的 Storkitty 账户</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid w-full max-w-sm items-center gap-3"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入邮箱" {...field} />
                    </FormControl>
                    <AnimatedFormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
                        {...field}
                      />
                    </FormControl>
                    <AnimatedFormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="w-full rounded-xl"
                type="submit"
                disabled={isPending}
              >
                {isPending && <Loader className="w-4 h-4 animate-spin" />}
                {isPending ? "登录中..." : "登录"}
              </Button>
            </form>
          </Form>
          <hr className="border-t border-border rounded-full" />
          <Button
            variant="outline"
            className="w-full rounded-xl"
            onClick={() => passkeyMutation.mutate(undefined)}
            disabled={passkeyMutation.isPending}
          >
            {passkeyMutation.isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <FingerprintPattern />
            )}
            使用通行密钥登录
          </Button>
          <div className="flex justify-end">
            <ThemeSwitch />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
