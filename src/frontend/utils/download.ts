/**
 * 生成文件下载URL
 */
export function generateDownloadUrl(
  filePath: string,
  directoryId: string,
): string {
  const baseUrl = window.location.origin;
  // 对路径的每个部分进行编码，但保留路径分隔符 /
  const encodedPath = filePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}/download/${directoryId}/${encodedPath}`;
}

/**
 * 直接下载文件
 */
export function downloadFile(
  filePath: string,
  fileName: string,
  directoryId: string,
): void {
  const url = generateDownloadUrl(filePath, directoryId);

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
 * 使用传统方法复制文本到剪贴板（HTTP环境下的回退方案）
 */
function fallbackCopyTextToClipboard(text: string): Promise<boolean> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "text";
    input.value = text;

    // 设置样式使其不可见但仍能被选中
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    input.style.opacity = "0";
    input.style.pointerEvents = "none";

    document.body.appendChild(input);

    // 异步执行确保DOM更新完成
    setTimeout(() => {
      input.focus();

      setTimeout(() => {
        input.select();
        input.setSelectionRange?.(0, input.value.length);

        let successful = false;
        try {
          successful = document.execCommand("copy");
        } catch (err) {
          console.error("复制失败:", err);
        }

        // 清理元素
        document.body.removeChild(input);
        resolve(successful);
      }, 10);
    }, 10);
  });
}

/**
 * 复制下载链接到剪贴板
 */
export async function copyDownloadLink(
  filePath: string,
  directoryId: string,
): Promise<boolean> {
  const url = generateDownloadUrl(filePath, directoryId);

  // 首先尝试使用现代的 clipboard API（仅在HTTPS环境下可用）
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error("现代 clipboard API 失败:", error);
      // 如果现代API失败，回退到传统方法
    }
  }

  // 使用传统方法作为回退方案
  return await fallbackCopyTextToClipboard(url);
}

/**
 * 检查是否支持复制到剪贴板
 */
export function canCopyToClipboard(): boolean {
  // 现代浏览器支持 clipboard API 或者支持传统的 execCommand
  return !!(navigator.clipboard?.writeText || document.execCommand);
}
