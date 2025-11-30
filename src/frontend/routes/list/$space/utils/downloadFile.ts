export function downloadFile(path: string, fileName: string) {
  console.log("path", path);
  console.log("fileName", fileName);
  const url = createDownloadUrl(path, fileName);
  console.log("url", url);
  // 创建一个临时的a标签来触发下载
  const link = document.createElement("a");
  link.href = url;

  // 如果提供了文件名，设置下载属性
  if (fileName) {
    link.download = fileName;
  }

  // 添加到DOM，点击，然后移除
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function createDownloadUrl(path: string, fileName: string) {
  const baseUrl = window.location.origin;
  const urlPath = path.endsWith("/") ? path : `${path}/`;
  const url = `${baseUrl}/download/${urlPath}${fileName}`;
  return url;
}
