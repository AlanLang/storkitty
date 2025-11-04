import { useEffect, useState } from "react";
import { useClipboard } from "../hooks/useClipboard";
import { useClipboardOperations } from "../hooks/useClipboardOperations";
import { ClipboardIndicator } from "./ClipboardIndicator";

interface ClipboardManagerProps {
  currentPath?: string;
  space: string;
}

export function ClipboardManager({
  currentPath,
  space,
}: ClipboardManagerProps) {
  const {
    item: clipboardItem,
    hasClipboardItem,
    canPasteToDirectory,
    clearClipboard,
  } = useClipboard();
  const { handlePaste, isPasting } = useClipboardOperations(space, currentPath);
  const [hasAnimated, setHasAnimated] = useState(false);

  // 检查是否应该显示动画
  useEffect(() => {
    if (hasClipboardItem() && clipboardItem && !hasAnimated) {
      setHasAnimated(true);
    } else if (!hasClipboardItem()) {
      setHasAnimated(false);
    }
  }, [hasClipboardItem, clipboardItem, hasAnimated]);

  // 如果没有剪贴板项目，不显示组件
  if (!hasClipboardItem() || !clipboardItem) {
    return null;
  }

  // 检查是否可以粘贴到当前目录
  const canPaste = canPasteToDirectory(space);

  return (
    <ClipboardIndicator
      item={clipboardItem}
      canPaste={canPaste}
      isPasting={isPasting}
      onPaste={handlePaste}
      onClear={clearClipboard}
      showAnimation={!hasAnimated}
    />
  );
}
