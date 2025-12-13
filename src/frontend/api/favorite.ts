import { http } from "@/api/http";
import z from "zod/v3";

export const createFavoriteSchema = z.object({
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

export type CreateFavoriteDto = z.infer<typeof createFavoriteSchema>;

export const createFavorite = async (dto: CreateFavoriteDto) => {
  return http.post<void>("favorite", {
    json: {
      name: dto.name,
      path: dto.path,
      icon: dto.icon ?? "",
    },
  });
};

export interface FavoriteInfo {
  id: number;
  name: string;
  path: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const getFavorites = async (): Promise<FavoriteInfo[]> => {
  return http.get("favorite").json<FavoriteInfo[]>();
};

export const deleteFavorite = async (id: number): Promise<void> => {
  return http.delete(`favorite/${id}`).json<void>();
};
