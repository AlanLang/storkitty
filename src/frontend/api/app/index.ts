import { http } from "@/api/http";
import z from "zod/v3";

const appInfoSchema = z.object({
  version: z.string(),
  initialed: z.boolean(),
  loggedIn: z.boolean(),
  user: z.nullable(
    z.object({
      id: z.number(),
      name: z.string(),
      avatar: z.string(),
      email: z.string(),
    }),
  ),
  storages: z.optional(
    z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        path: z.string(),
      }),
    ),
  ),
});

export type AppInfo = z.infer<typeof appInfoSchema>;

export function getAppInfo() {
  // 根据 appInfoSchema 校验返回值
  return http
    .get("app/info")
    .json()
    .then((data) => appInfoSchema.parse(data));
}
