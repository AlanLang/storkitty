import { http } from "@/api/http";
import z from "zod/v3";

const storageSchema = z.object({
  id: z.number(),
  name: z.string(),
  path: z.string(),
  localPath: z.string(),
  icon: z.string(),
  kind: z.enum(["local"]),
  maxFileSize: z.number(),
  allowExtensions: z.string(),
  blockExtensions: z.string(),
  disabled: z.boolean(),
  sortIndex: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Storage = z.infer<typeof storageSchema>;

export interface CreateStorageDto {
  name: string;
  path: string;
  localPath: string;
  icon: string;
  kind: string;
  maxFileSize: number;
  allowExtensions: string;
  blockExtensions: string;
  sortIndex: number;
}

export interface UpdateStorageDto {
  name: string;
  path: string;
  localPath: string;
  icon: string;
  kind: string;
}

export function getStorageList() {
  return http.get("storage").json<Storage[]>();
}

export function createStorage(data: CreateStorageDto) {
  return http.post("storage", { json: data }).json<void>();
}

export function updateStorage(id: number, data: UpdateStorageDto) {
  return http.put(`storage/${id}`, { json: data }).json<void>();
}

export function deleteStorage(id: number) {
  return http.delete(`storage/${id}`).json<void>();
}

export function disableStorage(id: number) {
  return http.post(`storage/disable/${id}`).json<void>();
}
