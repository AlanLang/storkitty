import { http } from "@/api/http";

export function compressDirectory(dto: { path: string; name: string }) {
  return http.post(`file/compress/${dto.path}`, {
    json: {
      name: dto.name,
    },
    timeout: 300000, // 5 minutes for compression
  });
}
