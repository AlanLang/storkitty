import { http } from "@/api/http";
import z from "zod/v3";

export const createLinkSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "收藏名称不能为空",
    })
    .max(100, {
      message: "收藏名称不能超过100个字符",
    }),
  path: z.string(),
  icon: z.string().optional(),
});

export type CreateLinkDto = z.infer<typeof createLinkSchema>;

export const createLink = async (dto: CreateLinkDto) => {
  return http.post<void>("link", {
    json: {
      name: dto.name,
      path: dto.path,
      icon: dto.icon ?? "",
    },
  });
};

export interface LinkInfo {
  id: number;
  name: string;
  path: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const getLinks = async (): Promise<LinkInfo[]> => {
  return http.get("link").json<LinkInfo[]>();
};

export const deleteLink = async (id: number): Promise<void> => {
  return http.delete(`link/${id}`).json<void>();
};
