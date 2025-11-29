import { listFiles } from "@/api/file/list";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export const QUERY_KEY = "fileList";

export function useFileList({
  space,
  splat,
}: {
  space: string;
  splat: string | undefined;
}) {
  const path = `${space}/${splat}`;
  return useQuery({
    queryKey: [QUERY_KEY, path],
    queryFn: () => listFiles(path),
    placeholderData: keepPreviousData,
  });
}
