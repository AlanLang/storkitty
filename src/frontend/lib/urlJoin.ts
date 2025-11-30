export function urlJoin(...paths: string[]) {
  return paths
    .map((path) => path.trim())
    .filter((path) => path)
    .join("/")
    .replace(/([^:]\/)\/+/g, "$1");
}
