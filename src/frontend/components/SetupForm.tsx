import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import type { SetupRequest } from "../types/auth";
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

interface SetupFormProps {
  onSetup: (setupData: SetupRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export function SetupForm({
  onSetup,
  isLoading,
  error,
  success,
}: SetupFormProps) {
  const [formData, setFormData] = useState<SetupRequest>({
    username: "",
    password: "",
    email: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 用户名验证
    if (!formData.username.trim()) {
      errors.username = "用户名不能为空";
    } else if (formData.username.length < 3) {
      errors.username = "用户名至少需要3个字符";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username = "用户名只能包含字母、数字和下划线";
    }

    // 密码验证
    if (!formData.password) {
      errors.password = "密码不能为空";
    } else if (formData.password.length < 6) {
      errors.password = "密码至少需要6个字符";
    }

    // 确认密码验证
    if (formData.password !== confirmPassword) {
      errors.confirmPassword = "两次输入的密码不一致";
    }

    // 邮箱验证
    if (!formData.email.trim()) {
      errors.email = "邮箱不能为空";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "请输入有效的邮箱地址";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSetup(formData);
    } catch (error) {
      console.error("Setup error:", error);
    }
  };

  const handleInputChange = (field: keyof SetupRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除对应字段的验证错误
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-green-600">设置完成</CardTitle>
          <CardDescription>
            系统初始化成功，正在跳转到文件管理界面...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>初始化系统设置</CardTitle>
        <CardDescription>
          欢迎使用 Storkitty！请设置管理员账户信息
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 用户名输入 */}
          <div className="space-y-2">
            <Label htmlFor="username">管理员用户名</Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="请输入用户名"
              disabled={isLoading}
              className={validationErrors.username ? "border-red-500" : ""}
            />
            {validationErrors.username && (
              <p className="text-sm text-red-500">
                {validationErrors.username}
              </p>
            )}
          </div>

          {/* 邮箱输入 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="请输入邮箱地址"
              disabled={isLoading}
              className={validationErrors.email ? "border-red-500" : ""}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* 密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="请输入密码（至少6位）"
              disabled={isLoading}
              className={validationErrors.password ? "border-red-500" : ""}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-500">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* 确认密码输入 */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (validationErrors.confirmPassword) {
                  setValidationErrors((prev) => {
                    const updated = { ...prev };
                    // biome-ignore lint/performance/noDelete: <explanation>
                    delete updated.confirmPassword;
                    return updated;
                  });
                }
              }}
              placeholder="请再次输入密码"
              disabled={isLoading}
              className={
                validationErrors.confirmPassword ? "border-red-500" : ""
              }
            />
            {validationErrors.confirmPassword && (
              <p className="text-sm text-red-500">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 提交按钮 */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在初始化...
              </>
            ) : (
              "完成设置"
            )}
          </Button>
        </form>

        {/* 安全提示 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>安全提示：</strong>
            请妥善保管您的登录凭据。设置完成后，您将使用这些信息登录系统。
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
