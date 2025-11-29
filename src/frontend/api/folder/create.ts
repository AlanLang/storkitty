import { http } from "@/api/http";
import z from "zod/v3";

const invalidChars = ["/", "\\", ":", "*", "?", "<", ">"];

// 检查系统保留名
const reservedNames = [
  ".",
  "..",
  ".DS_Store",
  ".chunks",
  "Thumbs.db",
  ".gitkeep",
  "desktop.ini",
  ".tmp",
  ".temp",
  "__pycache__",
  ".git",
  ".svn",
  "node_modules",
];

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "文件夹名称不能为空",
    })
    .max(255, {
      message: "文件夹名称不能超过255个字符",
    })
    .refine((name) => !invalidChars.includes(name), {
      message: `文件夹名称不能包含特殊字符: ${invalidChars.join(", ")}`,
    })
    .refine((name) => !reservedNames.includes(name), {
      message: "文件夹名称不能与系统保留名冲突",
    }),
  path: z.string(),
});

export type CreateFolderDto = z.infer<typeof createFolderSchema>;

export const createFolder = async (dto: CreateFolderDto) => {
  return http.post<void>(`folder/${dto.path}`, {
    json: {
      name: dto.name,
    },
  });
};
