'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const studentLinks = [
    { href: '/',            label: 'Dashboard' },
    { href: '/weekly',      label: 'Weekly' },
    { href: '/monthly',     label: 'Monthly' },
    { href: '/daily',       label: 'Daily' },
    { href: '/subjects',    label: 'Subjects' },
    { href: '/exams',       label: 'Exams' },
    { href: '/past-papers', label: 'Past Papers' },
  ];

  const parentLinks = [
    { href: '/parent',   label: 'Overview' },
    { href: '/monthly',  label: 'Monthly' },
    { href: '/subjects', label: 'Subjects' },
    { href: '/exams',    label: 'Exams' },
  ];

  const links = role === 'parent' ? parentLinks : studentLinks;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const linkClass = (href: string) =>
    cn(
      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
      pathname === href
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    );

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <span className="text-indigo-600 font-bold text-base flex-shrink-0 mr-3">
          📚 Revision
        </span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 overflow-x-auto flex-1">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <span className="text-sm text-gray-500 hidden lg:block">
            {displayName} ({role})
          </span>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile: current page indicator + hamburger */}
        <div className="flex md:hidden items-center gap-3 flex-1 justify-end">
          <span className="text-sm font-medium text-gray-700">
            {links.find((l) => l.href === pathname)?.label ?? 'Menu'}
          </span>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-50"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">{displayName}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
