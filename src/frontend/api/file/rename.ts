import { http } from "@/api/http";

export function renameFile(dto: { path: string; from: string; to: string }) {
  return http.patch(`file/${dto.path}`, {
    json: {
      from: dto.from,
      to: dto.to,
    },
  });
}
