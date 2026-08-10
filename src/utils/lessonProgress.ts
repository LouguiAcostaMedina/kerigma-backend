import { MIN_LESSONS_TO_GRADUATE, TOTAL_BIBLE_LESSONS } from '../constants/lessons';

export interface LessonProgressInput {
  isCompleted: boolean;
}

export interface LessonProgressSummary {
  completedLessons: number;
  totalLessons: number;
  progressPercentage: number;
  isEligibleForGraduation: boolean;
}

export function summarizeLessonProgress(lessons: readonly LessonProgressInput[]): LessonProgressSummary {
  const completedLessons = lessons.filter((lesson) => lesson.isCompleted).length;
  const progressPercentage = Math.round((completedLessons / TOTAL_BIBLE_LESSONS) * 100);

  return {
    completedLessons,
    totalLessons: TOTAL_BIBLE_LESSONS,
    progressPercentage,
    isEligibleForGraduation: completedLessons >= MIN_LESSONS_TO_GRADUATE,
  };
}
