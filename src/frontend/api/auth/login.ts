import { http } from "@/api/http";
import z from "zod/v3";

export const loginSchema = z.object({
  email: z
    .string()
    .min(2, { message: "邮箱至少2个字符" })
    .email({ message: "邮箱格式不正确" })
    .max(255, { message: "邮箱不能超过255个字符" }),
  password: z.string().min(5, { message: "密码至少5个字符" }),
});

export const loginResponseSchema = z.object({
  token: z.string(),
  storages: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      path: z.string(),
    }),
  ),
  user: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string(),
    email: z.string(),
  }),
});

export type LoginDto = z.infer<typeof loginSchema>;

export function login(loginData: LoginDto) {
  return http
    .post("login", {
      json: loginData,
    })
    .json<z.infer<typeof loginResponseSchema>>()
    .then((data) => loginResponseSchema.parse(data))
    .catch((error) => {
      throw error;
    });
}
