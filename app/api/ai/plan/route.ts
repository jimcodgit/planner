import { createGroq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { topics, subjectName, examDates, weeklyTargetHours } = await req.json();

  const topicLines = topics
    .slice(0, 20) // cap context
    .map((t: { name: string; status: string; daysSince: number | null; difficulty: number }) =>
      `- ${t.name} | ${t.status} | last revised: ${t.daysSince === null ? 'never' : `${t.daysSince}d ago`} | difficulty ${t.difficulty}/5`
    )
    .join('\n');

  const examLine = examDates.length > 0
    ? examDates.map((e: { label: string; days: number }) => `${e.label} in ${e.days} days`).join(', ')
    : 'no exams scheduled';

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `You are a concise, encouraging GCSE revision coach. Give practical, specific advice. Never use bullet points more than 5 items. Be direct.`,
    prompt: `Subject: ${subjectName}
Weekly revision target: ${weeklyTargetHours}h
Upcoming exams: ${examLine}

Topics (name | status | recency | difficulty):
${topicLines}

Give a focused revision recommendation for this week. Cover:
1. The 2–3 highest-priority topics to tackle and why
2. What type of activity suits each (Topic Review, Practice Questions, or Past Paper)
3. One thing to watch out for

Keep it under 200 words. Be specific to the topics listed.`,
    maxOutputTokens: 400,
  });

  return result.toTextStreamResponse();
}
