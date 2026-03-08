import type { Metadata } from 'next';
import './globals.css';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/layout/Nav';

export const metadata: Metadata = {
  title: "George's GCSE Planner",
  description: 'Plan and track GCSE revision',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, display_name')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        {user && profile && (
          <Nav role={profile.role} displayName={profile.display_name} />
        )}
        {children}
      </body>
    </html>
  );
}
