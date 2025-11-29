export async function writeTextIntoClipboard(value: string) {
  // 首先尝试使用现代的 clipboard API（仅在HTTPS环境下可用）
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.error("现代 clipboard API 失败:", error);
      // 如果现代API失败，回退到传统方法
    }
  }

  // 使用传统方法作为回退方案
  return await fallbackCopyTextToClipboard(value);
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
