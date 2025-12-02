import {
  getUserProfile,
  updatePassword,
  updateProfile,
  type UpdatePasswordDto,
} from "@/api/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FingerprintPattern, Lock, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings/user")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">用户设置</h1>
        <p className="text-muted-foreground mt-2">
          管理您的个人资料和账户安全设置
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            个人资料
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            密码和安全
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSettings() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: getUserProfile,
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setAvatar(profile.avatar);
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["appInfo"] });
      toast.success("个人资料已更新");
    },
    onError: () => {
      toast.error("更新失败");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, avatar });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>个人信息</CardTitle>
        <CardDescription>更新您的个人资料信息</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">邮箱地址不可修改</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">昵称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入您的昵称"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar">头像 URL</Label>
            <Input
              id="avatar"
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <p className="text-sm text-muted-foreground">
              输入头像图片的 URL 地址
            </p>
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "保存中..." : "保存更改"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordMutation = useMutation({
    mutationFn: (dto: UpdatePasswordDto) => updatePassword(dto),
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("密码已更新");
    },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("新密码长度至少为 6 个字符");
      return;
    }

    passwordMutation.mutate({
      oldPassword,
      newPassword,
    });
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            修改密码
          </CardTitle>
          <CardDescription>定期更新密码以保护您的账户安全</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">当前密码</Label>
              <Input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="输入当前密码"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? "更新中..." : "更新密码"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Passkey Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FingerprintPattern className="h-5 w-5" />
            通行密钥
          </CardTitle>
          <CardDescription>
            使用生物识别或硬件密钥进行无密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasskeyManagement />
        </CardContent>
      </Card>

      {/* Two-Factor Authentication - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            两步验证
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">即将推出</p>
            </div>
            <Button variant="outline" disabled>
              配置
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PasskeyManagement() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  const {
    data: passkeys,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const { listPasskeys } = await import("@/api/auth/webauthn");
      return listPasskeys();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (name: string) => {
      try {
        const { startPasskeyRegistration, finishPasskeyRegistration } =
          await import("@/api/auth/webauthn");
        console.log("Starting passkey registration...");
        const credential = await startPasskeyRegistration();
        console.log("Registration credential received:", credential);
        await finishPasskeyRegistration(credential, name);
        console.log("Passkey registration completed");
      } catch (error) {
        console.error("Passkey registration error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("通行密钥注册成功");
      setIsRegistering(false);
      setPasskeyName("");
      refetch();
    },
    onError: (error: any) => {
      console.error("Registration mutation error:", error);
      toast.error(error.message || "注册失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { deletePasskey } = await import("@/api/auth/webauthn");
      return deletePasskey(id);
    },
    onSuccess: () => {
      toast.success("通行密钥已删除");
      refetch();
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkeyName.trim()) {
      toast.error("请输入通行密钥名称");
      return;
    }
    registerMutation.mutate(passkeyName);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {passkeys && passkeys.length > 0 ? (
        <div className="space-y-2">
          {passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div>
                <p className="font-medium">{passkey.name}</p>
                <p className="text-sm text-muted-foreground">
                  创建于{" "}
                  {new Date(passkey.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteMutation.mutate(passkey.id)}
                disabled={deleteMutation.isPending}
              >
                删除
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 border rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">暂无通行密钥</p>
        </div>
      )}

      {!isRegistering ? (
        <Button onClick={() => setIsRegistering(true)}>
          <FingerprintPattern className="h-4 w-4" />
          注册新通行密钥
        </Button>
      ) : (
        <form onSubmit={handleRegister} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="passkeyName">通行密钥名称</Label>
            <Input
              id="passkeyName"
              value={passkeyName}
              onChange={(e) => setPasskeyName(e.target.value)}
              placeholder="例如：我的 MacBook"
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "注册中..." : "注册"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRegistering(false);
                setPasskeyName("");
              }}
              disabled={registerMutation.isPending}
            >
              取消
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
