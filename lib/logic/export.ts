import type { Subject, Topic, RevisionSession } from '@/types/database';

export interface ExportData {
  subjects: Subject[];
  topics: Topic[];
  sessions: RevisionSession[];
  exportedAt: string;
}

export function toCSV(data: ExportData): string {
  const rows: string[] = [];

  rows.push('=== SUBJECTS ===');
  rows.push('id,name,exam_board,color,weekly_target_hours,exam_dates');
  for (const s of data.subjects) {
    rows.push(
      [s.id, s.name, s.exam_board ?? '', s.color, s.weekly_target_hours, JSON.stringify(s.exam_dates)]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
  }

  rows.push('');
  rows.push('=== TOPICS ===');
  rows.push('id,subject_id,name,status,difficulty,priority,last_revised_at');
  for (const t of data.topics) {
    rows.push(
      [t.id, t.subject_id, t.name, t.status, t.difficulty, t.priority, t.last_revised_at ?? '']
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
  }

  rows.push('');
  rows.push('=== SESSIONS ===');
  rows.push('id,date,start_time,duration_minutes,subject_id,topic_id,type,status,skipped_count');
  for (const s of data.sessions) {
    rows.push(
      [s.id, s.date, s.start_time ?? '', s.duration_minutes, s.subject_id, s.topic_id ?? '', s.type, s.status, s.skipped_count]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
  }

  return rows.join('\n');
}
