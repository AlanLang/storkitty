import { http } from "@/api/http";

export function renameFolder(dto: { path: string; from: string; to: string }) {
  return http.patch(`folder/${dto.path}`, {
    json: {
      from: dto.from,
      to: dto.to,
    },
  });
}
