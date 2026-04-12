import { createGroq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The question text'),
      options: z.array(z.string()).length(4).describe('Exactly 4 answer options'),
      correct: z.number().min(0).max(3).describe('Index of the correct option (0–3)'),
      explanation: z.string().describe('Brief explanation of the correct answer'),
    })
  ).min(3).max(5),
});

export type QuizQuestion = z.infer<typeof QuizSchema>['questions'][number];

export async function POST(req: Request) {
  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { topicName, subjectName, difficulty, topicNotes } = await req.json();

  const questionCount = difficulty >= 4 ? 5 : 3;
  const levelHint = difficulty >= 4 ? 'challenging, higher-order' : difficulty <= 2 ? 'straightforward, recall-based' : 'moderate';

  const prompt = `Generate ${questionCount} ${levelHint} GCSE-level multiple choice questions about "${topicName}" for ${subjectName}.
${topicNotes ? `Context/notes for this topic: ${topicNotes}` : ''}

Requirements:
- Each question must have exactly 4 distinct answer options
- Only one option is correct
- Wrong options should be plausible (not obviously wrong)
- Explanation should be 1–2 sentences
- Questions should test understanding, not just recall`;

  try {
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: QuizSchema,
      prompt,
    });

    return Response.json(object);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate quiz';
    return Response.json({ error: message }, { status: 500 });
  }
}
