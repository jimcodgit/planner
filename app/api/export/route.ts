import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toCSV } from '@/lib/logic/export';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Fetch subjects (parent sees all)
  const subjectsQuery = profile?.role === 'parent'
    ? supabase.from('subjects').select('*')
    : supabase.from('subjects').select('*').eq('user_id', user.id);

  const { data: subjects } = await subjectsQuery;
  const subjectIds = subjects?.map((s) => s.id) ?? [];

  const [topicsResult, sessionsResult] = await Promise.all([
    supabase.from('topics').select('*').in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']),
    supabase.from('revision_sessions').select('*').in('subject_id', subjectIds.length > 0 ? subjectIds : ['x']),
  ]);

  const exportData = {
    subjects: subjects ?? [],
    topics: topicsResult.data ?? [],
    sessions: sessionsResult.data ?? [],
    exportedAt: new Date().toISOString(),
  };

  const format = request.nextUrl.searchParams.get('format') ?? 'json';

  if (format === 'csv') {
    const csv = toCSV(exportData);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="revision-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(exportData, {
    headers: {
      'Content-Disposition': `attachment; filename="revision-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
