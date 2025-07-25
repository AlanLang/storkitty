import { Eye, EyeOff, Loader2, Lock, LogIn, Shield, User } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!username || !password) {
      setLocalError("请填写用户名和密码");
      return;
    }

    const success = await login({ username, password });
    if (!success && !loginError) {
      setLocalError("登录失败，请检查用户名和密码");
    }
  };

  // 统一错误显示
  const displayError = localError || loginError;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="space-y-1 text-center">
            {/* Logo 和标题区域 */}
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(var(--primary))]">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">欢迎回来</CardTitle>
            <CardDescription>请登录您的 Storkitty 账户</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 用户名输入 */}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="pl-10"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* 密码输入 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-muted/50"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 错误提示 */}
              {displayError && (
                <Alert variant="destructive">
                  <AlertDescription>{displayError}</AlertDescription>
                </Alert>
              )}

              {/* 登录按钮 */}
              <Button type="submit" disabled={isLoggingIn} className="w-full">
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    登录
                  </>
                )}
              </Button>
            </form>

            {/* 测试账号信息 */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  演示账号
                </div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between items-center">
                    <span>用户名:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded border font-mono">
                      admin
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>密码:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded border font-mono">
                      admin123
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
