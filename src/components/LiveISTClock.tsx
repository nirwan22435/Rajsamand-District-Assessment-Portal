import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatISTTime, formatISTDate } from '../utils/dateTimeUtils';

interface LiveISTClockProps {
  className?: string;
  showDate?: boolean;
}

export const LiveISTClock: React.FC<LiveISTClockProps> = ({ className = '', showDate = true }) => {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = formatISTTime(now, { includeSeconds: true, includeTimezoneSuffix: true });
  const dateStr = formatISTDate(now, 'short');

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-semibold select-none shadow-2xs ${className}`}
      title="Indian Standard Time (IST, UTC+05:30) • Rajsamand District Official Time"
    >
      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
      <span className="font-mono tracking-tight font-bold text-amber-700 dark:text-amber-300">
        IST {timeStr}
      </span>
      {showDate && (
        <span className="text-slate-400 dark:text-slate-500 text-[10px] hidden sm:inline">
          • {dateStr}
        </span>
      )}
    </div>
  );
};
