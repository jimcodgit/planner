import { cn } from '@/lib/utils/cn';
import type { SessionType } from '@/types/database';

interface Props {
  type: SessionType;
  className?: string;
  size?: number;
}

export function SessionTypeIcon({ type, className, size = 16 }: Props) {
  const s = size;
  if (type === 'Topic Review') {
    // Open book
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" className={cn('flex-shrink-0', className)} aria-hidden>
        <path d="M2 4.5A2.5 2.5 0 014.5 2H10v16H4.5A2.5 2.5 0 012 15.5V4.5z" fill="currentColor" opacity=".25" />
        <path d="M18 4.5A2.5 2.5 0 0015.5 2H10v16h5.5A2.5 2.5 0 0018 15.5V4.5z" fill="currentColor" opacity=".4" />
        <path d="M10 2v16M4.5 6H8M4.5 9H8M4.5 12H8M12 6h3.5M12 9h3.5M12 12h3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'Practice Questions') {
    // Pencil / edit
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" className={cn('flex-shrink-0', className)} aria-hidden>
        <path d="M13.586 3.586a2 2 0 112.828 2.828L7 15.828 3 17l1.172-4L13.586 3.586z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 5.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'Practice Paper') {
    // Document with lines
    return (
      <svg width={s} height={s} viewBox="0 0 20 20" fill="none" className={cn('flex-shrink-0', className)} aria-hidden>
        <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 9h6M7 12h6M7 15h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      </svg>
    );
  }
  // Fallback — generic circle
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" className={cn('flex-shrink-0', className)} aria-hidden>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export const SESSION_TYPE_COLOR: Record<string, string> = {
  'Topic Review':       'bg-indigo-100 text-indigo-700',
  'Practice Questions': 'bg-amber-100 text-amber-700',
  'Practice Paper':     'bg-emerald-100 text-emerald-700',
};
