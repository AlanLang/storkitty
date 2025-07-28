import { useCallback, useEffect, useState } from "react";

export type ViewMode = "grid" | "list";

const VIEW_MODE_STORAGE_KEY = "storkitty_view_mode";
const DEFAULT_VIEW_MODE: ViewMode = "grid";

/**
 * 持久化的视图模式hook
 * 将用户的视图偏好保存到localStorage中，确保在页面刷新和导航之间保持一致
 */
export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // 从localStorage获取保存的视图模式，如果没有则使用默认值
    try {
      const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (
        savedViewMode &&
        (savedViewMode === "grid" || savedViewMode === "list")
      ) {
        return savedViewMode as ViewMode;
      }
    } catch (error) {
      // localStorage可能不可用，忽略错误并使用默认值
      console.warn("Failed to read view mode from localStorage:", error);
    }
    return DEFAULT_VIEW_MODE;
  });

  // 更新视图模式并保存到localStorage
  const setViewMode = useCallback((newViewMode: ViewMode) => {
    setViewModeState(newViewMode);

    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, newViewMode);
    } catch (error) {
      // localStorage可能不可用，忽略错误
      console.warn("Failed to save view mode to localStorage:", error);
    }
  }, []);

  // 监听localStorage变化，支持多标签页同步
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === VIEW_MODE_STORAGE_KEY && e.newValue) {
        const newViewMode = e.newValue as ViewMode;
        if (newViewMode === "grid" || newViewMode === "list") {
          setViewModeState(newViewMode);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return { viewMode, setViewMode };
}
