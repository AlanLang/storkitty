import { http } from "@/api/http";
import z from "zod/v3";

export enum FileType {
  File = "file",
  Folder = "folder",
}

const fileListSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      fileType: z.nativeEnum(FileType),
      size: z.nullable(z.number()),
      items: z.nullable(z.number()),
      modified: z.string(),
    }),
  ),
});

export type FileInfo = z.infer<typeof fileListSchema>["files"][number];

export async function listFiles(path: string) {
  const response = await http.get(`file/list/${path}`);
  return response.json().then(fileListSchema.parse);
}
