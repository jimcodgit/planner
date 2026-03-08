import { cn } from '@/lib/utils/cn';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function PageWrapper({ children, className, title }: PageWrapperProps) {
  return (
    <main className={cn('max-w-5xl mx-auto px-4 py-6', className)}>
      {title && (
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      )}
      {children}
    </main>
  );
}
