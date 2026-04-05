'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types/database';

interface NavProps {
  role: UserRole;
  displayName: string;
}

export function Nav({ role, displayName }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const studentLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/weekly', label: 'Weekly' },
    { href: '/monthly', label: 'Monthly' },
    { href: '/daily', label: 'Daily' },
    { href: '/subjects', label: 'Subjects' },
    { href: '/exams', label: 'Exams' },
    { href: '/past-papers', label: 'Past Papers' },
  ];

  const parentLinks = [
    { href: '/parent', label: 'Overview' },
    { href: '/monthly', label: 'Monthly' },
    { href: '/subjects', label: 'Subjects' },
    { href: '/exams', label: 'Exams' },
  ];

  const links = role === 'parent' ? parentLinks : studentLinks;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-1">
          <span className="text-indigo-600 font-bold text-lg mr-4">📚 Revision</span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 hidden sm:block">
            {displayName} ({role})
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
