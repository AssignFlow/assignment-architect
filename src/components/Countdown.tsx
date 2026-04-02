import { useEffect, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

interface CountdownProps {
  targetDate: string | Date;
  className?: string;
  prefix?: string;
}

export default function Countdown({ targetDate, className, prefix = 'Due in' }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      
      if (isPast(target)) {
        return 'Past due';
      }

      const days = differenceInDays(target, now);
      const hours = differenceInHours(target, now) % 24;
      const minutes = differenceInMinutes(target, now) % 60;
      const seconds = differenceInSeconds(target, now) % 60;

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      return `${prefix} ${parts.join(' ')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, prefix]);

  return <span className={cn('tabular-nums tracking-tight', className)}>{timeLeft}</span>;
}
