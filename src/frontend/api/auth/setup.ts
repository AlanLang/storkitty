import { http } from "@/api/http";
import z from "zod/v3";

export const setupUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "用户名称至少2个字符" })
    .max(20, { message: "用户名称不能超过20个字符" }),
  email: z
    .string()
    .min(2, { message: "邮箱至少2个字符" })
    .email({ message: "邮箱格式不正确" })
    .max(255, { message: "邮箱不能超过255个字符" }),
  password: z.string().min(5, { message: "密码至少5个字符" }),
  confirmPassword: z.string().min(5, { message: "密码至少5个字符" }),
});

export const setupStorageSchema = z.object({
  name: z
    .string()
    .min(2, { message: "存储名称至少2个字符" })
    .max(20, { message: "存储名称不能超过20个字符" }),
  path: z
    .string()
    .min(2, { message: "存储路径至少2个字符" })
    .max(200, { message: "存储路径不能超过200个字符" })
    .regex(/^[a-zA-Z0-9]+$/, { message: "存储路径只能包含英文或数字" }),
  localPath: z
    .string()
    .min(2, { message: "本地路径至少2个字符" })
    .max(200, { message: "本地路径不能超过200个字符" }),
});

export type SetupUserDto = z.infer<typeof setupUserSchema>;
export type SetupStorageDto = z.infer<typeof setupStorageSchema>;

export function setup(value: { user: SetupUserDto; storage: SetupStorageDto }) {
  return http
    .post("setup", {
      json: {
        user: value.user,
        storage: {
          ...value.storage,
          maxFileSize: 0,
          allowExtensions: "",
          blockExtensions: "",
          sortIndex: 0,
          icon: "",
          kind: "local",
        },
      },
    })
    .json<void>();
}
