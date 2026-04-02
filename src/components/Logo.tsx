import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("h-8 w-8 shrink-0", className)}>
      <circle cx="50" cy="50" r="50" fill="#F1F5F9" className="dark:fill-slate-800" />
      <path d="M 28 72 L 53 35 L 72 35" stroke="#115E59" className="dark:stroke-teal-400" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 40 55 Q 53 45 68 50" stroke="#115E59" className="dark:stroke-teal-400" strokeWidth="8" strokeLinecap="round" />
      <path d="M 53 35 L 53 72" stroke="#115E59" className="dark:stroke-teal-400" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}
