import { describe, expect, it } from 'vitest';
import {
  BIBLE_LESSON_TITLES,
  GRADUATION_THRESHOLD_PERCENT,
  MIN_LESSONS_TO_GRADUATE,
  TOTAL_BIBLE_LESSONS,
} from '../../src/constants/lessons';
import { summarizeLessonProgress } from '../../src/utils/lessonProgress';

describe('constants/lessons', () => {
  it('define exactamente 20 lecciones bíblicas únicas', () => {
    expect(TOTAL_BIBLE_LESSONS).toBe(20);
    expect(BIBLE_LESSON_TITLES).toHaveLength(20);
    expect(new Set(BIBLE_LESSON_TITLES).size).toBe(20);
  });

  it('la primera y la última lección son las esperadas', () => {
    expect(BIBLE_LESSON_TITLES[0]).toBe('La Salvación');
    expect(BIBLE_LESSON_TITLES[19]).toBe('La Madurez Espiritual');
  });

  it('el umbral de graduación es 80% y equivale a 16 lecciones', () => {
    expect(GRADUATION_THRESHOLD_PERCENT).toBe(80);
    expect(MIN_LESSONS_TO_GRADUATE).toBe(16);
    expect(Math.ceil((GRADUATION_THRESHOLD_PERCENT * TOTAL_BIBLE_LESSONS) / 100)).toBe(MIN_LESSONS_TO_GRADUATE);
  });
});

describe('summarizeLessonProgress', () => {
  it('sin lecciones completadas el progreso es 0% y no puede graduarse', () => {
    const result = summarizeLessonProgress(BIBLE_LESSON_TITLES.map(() => ({ isCompleted: false })));
    expect(result.completedLessons).toBe(0);
    expect(result.totalLessons).toBe(20);
    expect(result.progressPercentage).toBe(0);
    expect(result.isEligibleForGraduation).toBe(false);
  });

  it('con las 20 lecciones completadas el progreso es 100%', () => {
    const result = summarizeLessonProgress(BIBLE_LESSON_TITLES.map(() => ({ isCompleted: true })));
    expect(result.completedLessons).toBe(20);
    expect(result.progressPercentage).toBe(100);
    expect(result.isEligibleForGraduation).toBe(true);
  });

  it.each([
    [1, 5],
    [2, 10],
    [3, 15],
    [4, 20],
    [5, 25],
    [6, 30],
    [7, 35],
    [8, 40],
    [9, 45],
    [10, 50],
    [11, 55],
    [12, 60],
    [13, 65],
    [14, 70],
    [15, 75],
    [16, 80],
    [17, 85],
    [18, 90],
    [19, 95],
    [20, 100],
  ])('con %i lecciones completadas el progreso es %i%%', (completed, expectedPercent) => {
    const lessons = BIBLE_LESSON_TITLES.map((_, index) => ({ isCompleted: index < completed }));
    const result = summarizeLessonProgress(lessons);
    expect(result.completedLessons).toBe(completed);
    expect(result.progressPercentage).toBe(expectedPercent);
  });

  it('es elegible para graduación solo a partir de 16 lecciones (80%)', () => {
    for (let completed = 0; completed <= 20; completed++) {
      const lessons = BIBLE_LESSON_TITLES.map((_, index) => ({ isCompleted: index < completed }));
      const result = summarizeLessonProgress(lessons);
      expect(result.isEligibleForGraduation).toBe(completed >= MIN_LESSONS_TO_GRADUATE);
    }
  });
});
