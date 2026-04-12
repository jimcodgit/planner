import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const QuizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()).length(4),
      correct: z.number().min(0).max(3),
      explanation: z.string(),
    })
  ).min(3).max(5),
});

export type QuizQuestion = z.infer<typeof QuizSchema>['questions'][number];

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { topicName, subjectName, difficulty, topicNotes } = await req.json();

  const questionCount = difficulty >= 4 ? 5 : 3;
  const levelHint = difficulty >= 4 ? 'challenging, higher-order' : difficulty <= 2 ? 'straightforward, recall-based' : 'moderate';

  const prompt = `Generate ${questionCount} ${levelHint} GCSE-level multiple choice questions about "${topicName}" for ${subjectName}.
${topicNotes ? `Context/notes for this topic: ${topicNotes}` : ''}

Return ONLY a JSON object with this exact structure — no markdown, no extra text:
{
  "questions": [
    {
      "question": "...",
      "options": ["option A", "option B", "option C", "option D"],
      "correct": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- options must be an array of exactly 4 strings
- correct is the index (0–3) of the correct option
- wrong options should be plausible, not obviously wrong
- explanation is 1–2 sentences
- questions test understanding, not just recall`;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
      maxOutputTokens: 1200,
    });

    // Strip any accidental markdown fences
    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    const validated = QuizSchema.parse(parsed);
    return Response.json(validated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate quiz';
    return Response.json({ error: message }, { status: 500 });
  }
}
