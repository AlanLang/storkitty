/**
 * 生成文件下载URL
 */
export function generateDownloadUrl(filePath: string): string {
  const baseUrl = window.location.origin;
  const encodedPath = encodeURIComponent(filePath);
  return `${baseUrl}/api/files/download/${encodedPath}`;
}

/**
 * 直接下载文件
 */
export function downloadFile(filePath: string, fileName?: string): void {
  const url = generateDownloadUrl(filePath);

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

/**
 * 复制下载链接到剪贴板
 */
export async function copyDownloadLink(filePath: string): Promise<boolean> {
  try {
    const url = generateDownloadUrl(filePath);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy download link:", error);
    return false;
  }
}

/**
 * 检查是否支持复制到剪贴板
 */
export function canCopyToClipboard(): boolean {
  return !!navigator.clipboard?.writeText;
}
