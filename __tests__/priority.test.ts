import { computePriorityScore, sortByPriority } from '@/lib/logic/priority';
import type { Topic, ExamDate } from '@/types/database';
import { addDays, format } from 'date-fns';

function isoDate(daysFromNow: number): string {
  return format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
}

function makeTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: '1',
    subject_id: 's1',
    name: 'Test Topic',
    status: 'Not Started',
    difficulty: 3,
    priority: 'Normal',
    notes: null,
    last_revised_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const noExams: ExamDate[] = [];
const nearExam: ExamDate[] = [{ label: 'Paper 1', date: isoDate(10) }];
const farExam: ExamDate[] = [{ label: 'Paper 1', date: isoDate(100) }];
const pastExam: ExamDate[] = [{ label: 'Paper 1', date: isoDate(-5) }];

describe('computePriorityScore', () => {
  it('returns a number between 0 and 100', () => {
    const score = computePriorityScore(makeTopic(), noExams);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('gives higher score with a near exam vs far exam', () => {
    const topic = makeTopic({ status: 'Not Started' });
    const nearScore = computePriorityScore(topic, nearExam);
    const farScore = computePriorityScore(topic, farExam);
    expect(nearScore).toBeGreaterThan(farScore);
  });

  it('gives higher score for Not Started vs Confident', () => {
    const notStarted = computePriorityScore(makeTopic({ status: 'Not Started' }), nearExam);
    const confident = computePriorityScore(makeTopic({ status: 'Confident' }), nearExam);
    expect(notStarted).toBeGreaterThan(confident);
  });

  it('gives higher score for higher difficulty', () => {
    const hard = computePriorityScore(makeTopic({ difficulty: 5 }), nearExam);
    const easy = computePriorityScore(makeTopic({ difficulty: 1 }), nearExam);
    expect(hard).toBeGreaterThan(easy);
  });

  it('gives higher score for never revised vs recently revised', () => {
    const neverRevised = computePriorityScore(makeTopic({ last_revised_at: null }), nearExam);
    const recentlyRevised = computePriorityScore(
      makeTopic({ last_revised_at: new Date().toISOString() }),
      nearExam
    );
    expect(neverRevised).toBeGreaterThan(recentlyRevised);
  });

  it('gives higher score for stale topic (14+ days) vs fresh', () => {
    const stale = computePriorityScore(
      makeTopic({ last_revised_at: format(addDays(new Date(), -14), "yyyy-MM-dd'T'HH:mm:ss") }),
      nearExam
    );
    const fresh = computePriorityScore(
      makeTopic({ last_revised_at: new Date().toISOString() }),
      nearExam
    );
    expect(stale).toBeGreaterThan(fresh);
  });

  it('returns 0 exam urgency when all exams are in the past', () => {
    const withPast = computePriorityScore(makeTopic({ status: 'Confident', difficulty: 1, last_revised_at: new Date().toISOString() }), pastExam);
    const withNone = computePriorityScore(makeTopic({ status: 'Confident', difficulty: 1, last_revised_at: new Date().toISOString() }), noExams);
    // Past exam urgency is 0, no exam urgency defaults to 0.5 — so past should score lower
    expect(withPast).toBeLessThan(withNone);
  });

  it('uses 0.5 urgency when no exam dates provided', () => {
    const score = computePriorityScore(makeTopic({ status: 'Not Started', last_revised_at: null }), noExams);
    // Should still give a meaningful score
    expect(score).toBeGreaterThan(0);
  });
});

describe('sortByPriority', () => {
  it('sorts topics from highest to lowest score', () => {
    const topics = [
      makeTopic({ id: '1', status: 'Confident', difficulty: 1 }),
      makeTopic({ id: '2', status: 'Not Started', difficulty: 5 }),
      makeTopic({ id: '3', status: 'Wobbly', difficulty: 3 }),
    ];
    const sorted = sortByPriority(topics, nearExam);
    expect(sorted[0].id).toBe('2');
    expect(sorted[sorted.length - 1].id).toBe('1');
  });

  it('attaches a priorityScore to each topic', () => {
    const topics = [makeTopic()];
    const sorted = sortByPriority(topics, nearExam);
    expect(typeof sorted[0].priorityScore).toBe('number');
  });

  it('handles empty topic list', () => {
    expect(sortByPriority([], nearExam)).toEqual([]);
  });
});
