import { http } from "@/api/http";

export function copyFile(dto: { from: string; to: string }) {
  return http.post(`file/copy`, {
    json: {
      from: dto.from,
      to: dto.to,
    },
  });
}

export function moveFile(dto: { from: string; to: string }) {
  return http.post(`file/move`, {
    json: {
      from: dto.from,
      to: dto.to,
    },
  });
}
