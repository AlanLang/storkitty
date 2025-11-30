import { http } from "@/api/http";

export interface RemoteDownloadTask {
  id: string;
  url: string;
  path: string;
  name: string;
  size: number | null;
  downloaded: number;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  created_at: number;
  error: string | null;
}

export const createRemoteDownload = async (path: string, urls: string[]) => {
  await http.post<string[]>(`remote_download/${path}`, {
    json: { urls },
  });
};

export const getRemoteDownloadList = async (path: string) => {
  const response = await http.get<RemoteDownloadTask[]>(
    `remote_download/${path}`,
  );
  return response.json();
};

export const cancelRemoteDownload = async (path: string, id: string) => {
  await http.delete(`remote_download/${path}`, {
    json: { id },
  });
};

export const clearRemoteDownloads = async () => {
  await http.post("remote_download/clear");
};
