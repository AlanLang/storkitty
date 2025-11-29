import {
  setup,
  type SetupStorageDto,
  setupStorageSchema,
  type SetupUserDto,
  setupUserSchema,
} from "@/api/auth/setup";
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
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useApp, useSetInitialed } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  animated,
  config,
  easings,
  useSpring,
  useTransition,
} from "@react-spring/web";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Loader } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import useMeasure from "react-use-measure";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

function RouteComponent() {
  const app = useApp();
  if (app.initialed) {
    if (app.loggedIn) {
      return <Navigate to="/" />;
    }
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl title">系统初始化</CardTitle>
          <CardDescription>请完成系统初始化</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SetupForm />
        </CardContent>
      </Card>
    </div>
  );
}

function SetupForm() {
  const [tab, setTab] = useState<"user" | "storage">("user");
  const [userData, setUserData] = useState<SetupUserDto | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const showAnimation = useRef(false);
  const navigate = useNavigate();
  const setInitialed = useSetInitialed();

  // 测量内容高度
  const [measureRef, { height: viewHeight }] = useMeasure();

  // 高度动画
  const heightSpring = useSpring({
    height: viewHeight > 0 ? viewHeight : "auto",
    config: { duration: 200, easing: easings.easeOutCubic },
    //config: config.molasses,
  });

  const handleUserSubmit = (values: SetupUserDto) => {
    showAnimation.current = true;
    setDirection("forward");
    setTab("storage");
    setUserData(values);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: setup,
    onSuccess: () => {
      setInitialed();
      navigate({ to: "/login" });
    },
  });

  const handleStorageSubmit = (values: SetupStorageDto) => {
    userData && mutate({ user: userData, storage: values });
  };

  const handleBack = () => {
    showAnimation.current = true;
    setDirection("backward");
    setTab("user");
  };

  // 表单切换动画
  const formTransition = useTransition(tab, {
    from: () => {
      if (!showAnimation.current) {
        return { opacity: 1, transform: "translateX(0px)" };
      }
      const offset = direction === "forward" ? 100 : -100;
      return { opacity: 0, transform: `translateX(${offset}px)` };
    },
    enter: { opacity: 1, transform: "translateX(0px)" },
    leave: () => {
      const offset = direction === "forward" ? -100 : 100;
      return { opacity: 0, transform: `translateX(${offset}px)` };
    },
    config: { ...config.default, duration: 200 },
  });

  return (
    <animated.div style={heightSpring} className="overflow-hidden">
      <div ref={measureRef} className="space-y-6">
        {/* 步骤指示器 */}
        <StepIndicatorGroup
          currentStep={tab === "user" ? 1 : 2}
          totalSteps={2}
        />
        {/* 步骤标题 */}
        <StepTitle tab={tab} />

        {/* 表单内容 */}
        <div className="grid overflow-hidden">
          {formTransition((style, item) => (
            <animated.div
              style={{
                ...style,
                gridArea: "1 / 1",
              }}
            >
              {item === "user" ? (
                <SetupUserForm value={userData} onSubmit={handleUserSubmit} />
              ) : (
                <SetupStorageForm
                  pending={isPending}
                  onSubmit={handleStorageSubmit}
                  onBack={handleBack}
                />
              )}
            </animated.div>
          ))}
        </div>
      </div>
    </animated.div>
  );
}

function StepTitle({ tab }: { tab: "user" | "storage" }) {
  const titleTransition = useTransition(tab, {
    from: { opacity: 0, transform: "translateY(-10px)" },
    enter: { opacity: 1, transform: "translateY(0px)" },
    leave: { opacity: 0, transform: "translateY(10px)" },
    config: { ...config.default, duration: 200 },
  });
  return (
    <div className="relative h-6">
      {titleTransition((style, item) => (
        <animated.div style={style} className="absolute inset-0 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            {item === "user"
              ? "步骤 1: 设置管理员账户"
              : "步骤 2: 配置存储路径"}
          </p>
        </animated.div>
      ))}
    </div>
  );
}

function StepIndicatorGroup({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, index) => index + 1).map(
        (step) => (
          <StepIndicator
            key={step}
            step={step}
            currentStep={currentStep}
            totalSteps={totalSteps}
          />
        ),
      )}
    </div>
  );
}

function StepIndicator({
  step,
  currentStep,
  totalSteps,
}: {
  step: number;
  currentStep: number;
  totalSteps: number;
}) {
  // 步骤圆圈缩放动画
  const circleSpring = useSpring({
    scale: step === currentStep ? 1 : 0.9,
    config: config.gentle,
  });

  // 连接线伸缩动画
  const lineSpring = useSpring({
    scaleX: step < currentStep ? 1 : 0.5,
    config: config.gentle,
  });

  return (
    <div className="flex items-center">
      <animated.div
        style={circleSpring}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
          step === currentStep
            ? "bg-primary text-primary-foreground"
            : step < currentStep
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground",
        )}
      >
        {step}
      </animated.div>
      {step < totalSteps && (
        <animated.div
          style={lineSpring}
          className={cn(
            "mx-2 h-[2px] w-12 rounded-full transition-colors origin-left",
            step < currentStep ? "bg-primary" : "bg-muted",
          )}
        />
      )}
    </div>
  );
}

function SetupUserForm({
  value,
  onSubmit,
}: {
  value: SetupUserDto | null;
  onSubmit: (values: SetupUserDto) => void;
}) {
  const form = useForm<SetupUserDto>({
    resolver: zodResolver(setupUserSchema),
    defaultValues: value ?? {
      name: "admin",
      email: "admin@example.com",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSubmit = (values: SetupUserDto) => {
    if (values.password !== values.confirmPassword) {
      form.setError("confirmPassword", {
        message: "密码不一致",
      });
      return;
    }
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid w-full items-center gap-3 px-4"
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
                <Input type="password" placeholder="请输入密码" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>确认密码</FormLabel>
              <FormControl>
                <Input type="password" placeholder="请确认密码" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名称</FormLabel>
              <FormControl>
                <Input placeholder="请输入用户名称" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full rounded-xl" type="submit">
          下一步
        </Button>
      </form>
    </Form>
  );
}

function AnimatedFormMessage({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  const transition = useTransition(body, {
    from: { opacity: 0, height: 0, transform: "translateY(-10px)" },
    enter: { opacity: 1, height: "auto", transform: "translateY(0px)" },
    leave: { opacity: 0, height: 0, transform: "translateY(-10px)" },
    config: { ...config.default, duration: 200 },
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

function SetupStorageForm({
  onSubmit,
  onBack,
  pending,
}: {
  onSubmit: (values: SetupStorageDto) => void;
  onBack: () => void;
  pending: boolean;
}) {
  const form = useForm<SetupStorageDto>({
    resolver: zodResolver(setupStorageSchema),
    defaultValues: {
      name: "默认",
      path: "data",
      localPath: "./data",
    },
  });

  const handleSubmit = (values: SetupStorageDto) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid w-full items-center gap-3 px-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>存储名称</FormLabel>
              <FormControl>
                <Input placeholder="请输入存储名称" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            <FormItem>
              <FormLabel>存储路径</FormLabel>
              <FormControl>
                <Input placeholder="请输入存储路径" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="localPath"
          render={({ field }) => (
            <FormItem>
              <FormLabel>本地路径</FormLabel>
              <FormControl>
                <Input placeholder="请输入本地路径" {...field} />
              </FormControl>
              <AnimatedFormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full rounded-xl" type="submit">
          {pending ? <Loader className="w-4 h-4 animate-spin" /> : "完成"}
        </Button>

        <div className="flex justify-start">
          <Button size="sm" variant="ghost" type="button" onClick={onBack}>
            <ChevronLeft />
            上一步
          </Button>
        </div>
      </form>
    </Form>
  );
}
