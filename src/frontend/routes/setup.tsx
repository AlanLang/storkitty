import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { setupApi } from "../api/auth";
import { SetupForm } from "../components/SetupForm";
import type { SetupRequest } from "../types/auth";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // 检查是否需要初始化
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const status = await setupApi.checkStatus();
        if (!status.needs_setup) {
          // 如果不需要设置，重定向到登录页面
          navigate({ to: "/login", replace: true });
          return;
        }
      } catch (error) {
        console.error("检查设置状态失败:", error);
        setError("无法检查系统状态，请刷新页面重试");
      } finally {
        setCheckingStatus(false);
      }
    };

    checkSetupStatus();
  }, [navigate]);

  const handleSetup = async (setupData: SetupRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await setupApi.initialize(setupData);

      if (response.success && response.token) {
        setSuccess(true);

        // 保存token到localStorage
        localStorage.setItem("token", response.token);

        // 触发token变化事件，让AuthContext重新获取用户信息
        window.dispatchEvent(new Event("tokenChange"));

        // 显示成功消息
        toast.success("系统初始化成功！");

        // 延迟跳转到文件管理页面
        setTimeout(() => {
          navigate({
            to: "/",
            replace: true,
          });
        }, 2000);
      } else {
        setError(response.message || "初始化失败，请重试");
      }
    } catch (error) {
      console.error("Setup error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("初始化过程中发生错误，请重试");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 显示加载状态
  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">正在检查系统状态...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Storkitty</h1>
          <p className="text-gray-600">轻量级文件管理系统</p>
        </div>

        <SetupForm
          onSetup={handleSetup}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}
