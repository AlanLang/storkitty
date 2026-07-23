import { http } from "@/api/http";

export const generateUploadToken = async (
  path: string,
): Promise<{ token: string }> => {
  return http.post("upload-script", { json: { path } }).json();
};
