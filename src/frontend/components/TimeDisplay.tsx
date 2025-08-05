import { useEffect, useState } from "react";
import { formatFullTime, formatRelativeTime } from "../utils/timeUtils";
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
    formatRelativeTime(timeString),
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
      (now.getTime() - fileTime.getTime()) / (1000 * 60),
    );

    let interval: NodeJS.Timeout;

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
