import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface TimeDisplayProps {
  /** 完整时间字符串，格式为 "YYYY-MM-DD HH:mm:ss" */
  timeString: string;
  /** 额外的 CSS 类名 */
  className?: string;
}

export function TimeDisplay({ timeString, className = "" }: TimeDisplayProps) {
  const [relativeTime, setRelativeTime] = useState(() =>
    formatRelativeTime(timeString)
  );

  // 定期更新相对时间显示
  useEffect(() => {
    const updateRelativeTime = () => {
      setRelativeTime(formatRelativeTime(timeString));
    };

    // 初始更新
    updateRelativeTime();

    // 根据时间差设置不同的更新频率
    const now = new Date();
    const fileTime = new Date(timeString.replace(" ", "T"));
    const diffMinutes = Math.floor(
      (now.getTime() - fileTime.getTime()) / (1000 * 60)
    );

    let interval: ReturnType<typeof setInterval>;

    if (diffMinutes < 1) {
      // 1分钟内：每秒更新
      interval = setInterval(updateRelativeTime, 1000);
    } else if (diffMinutes < 60) {
      // 1小时内：每分钟更新
      interval = setInterval(updateRelativeTime, 60 * 1000);
    } else if (diffMinutes < 1440) {
      // 24小时
      // 24小时内：每小时更新
      interval = setInterval(updateRelativeTime, 60 * 60 * 1000);
    }
    // 超过24小时不需要频繁更新

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [timeString]);

  const fullTime = formatFullTime(timeString);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <span className={`font-mono ${className}`}>{relativeTime}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{fullTime}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * 时间工具函数
 * 用于处理时间格式化和相对时间计算
 */

/**
 * 将时间字符串转换为相对时间显示
 * @param timeString - 格式为 "YYYY-MM-DD HH:mm:ss" 的时间字符串
 * @returns 相对时间字符串，如 "2分钟前"、"1小时前" 等
 */
export function formatRelativeTime(timeString: string): string {
  try {
    // 解析时间字符串为 Date 对象
    const fileTime = new Date(timeString.replace(" ", "T"));
    const now = new Date();
    const diffMs = now.getTime() - fileTime.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 0) {
      return "刚刚"; // 处理未来时间的边界情况
    }

    if (diffSeconds < 60) {
      return diffSeconds === 0 ? "刚刚" : `${diffSeconds}秒前`;
    }

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours}小时前`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
      return `${diffDays}天前`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths}个月前`;
    }

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears}年前`;
  } catch (error) {
    console.warn("Failed to parse time string:", timeString, error);
    return timeString; // 解析失败时返回原始字符串
  }
}

/**
 * 格式化完整时间显示（用于 tooltip）
 * @param timeString - 格式为 "YYYY-MM-DD HH:mm:ss" 的时间字符串
 * @returns 格式化的完整时间字符串
 */
export function formatFullTime(timeString: string): string {
  try {
    const date = new Date(timeString.replace(" ", "T"));
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.warn("Failed to format time string:", timeString, error);
    return timeString; // 格式化失败时返回原始字符串
  }
}
