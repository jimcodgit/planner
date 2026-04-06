import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'gray';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-indigo-100 text-indigo-700',
  green:   'bg-green-100 text-green-700',
  yellow:  'bg-yellow-100 text-yellow-800',
  orange:  'bg-orange-100 text-orange-700',
  red:     'bg-red-100 text-red-700',
  blue:    'bg-blue-100 text-blue-700',
  gray:    'bg-gray-100 text-gray-600',
};

export function Badge({ children, className, variant = 'default', size = 'sm' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm'  ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
