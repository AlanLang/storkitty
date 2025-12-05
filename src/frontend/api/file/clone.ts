import { http } from "@/api/http";
import { urlJoin } from "@/lib/urlJoin";

export async function cloneFile(dto: { path: string; fileName: string }) {
  const { path, fileName } = dto;
  return http.post(`file/clone/${urlJoin(path, fileName)}`);
}
