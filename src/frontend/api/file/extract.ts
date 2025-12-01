import { http } from "@/api/http";

export function extractFile(dto: { path: string; name: string }) {
  return http.post(`file/extract/${dto.path}`, {
    json: {
      name: dto.name,
    },
    timeout: 300000, // 5 minutes for extraction
  });
}
