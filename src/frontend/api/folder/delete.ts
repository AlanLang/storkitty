import { http } from "@/api/http";

export function deleteFolder(dto: { path: string; name: string }) {
  return http.delete(`folder/${dto.path}`, {
    json: {
      targets: [dto.name],
    },
  });
}
