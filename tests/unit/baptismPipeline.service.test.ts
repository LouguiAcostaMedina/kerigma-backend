import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDb = vi.hoisted(() => ({
  BibleStudent: {
    count: vi.fn(),
    findAll: vi.fn(),
  },
  BibleLessonProgress: {
    findAll: vi.fn(),
  },
  sequelize: {
    query: vi.fn(),
    fn: vi.fn(),
    col: vi.fn(),
    cast: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as baptismPipelineService from '../../src/services/baptismPipeline.service';

describe('baptismPipeline.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPipelineMetrics', () => {
    it('returns funnel with correct counts', async () => {
      mockDb.BibleStudent.count
        .mockResolvedValueOnce(10)  // studying
        .mockResolvedValueOnce(5)   // candidates
        .mockResolvedValueOnce(3)   // baptized
        .mockResolvedValueOnce(2);  // fullMember

      mockDb.sequelize.query
        .mockResolvedValueOnce([{ avg_days: 30 }])
        .mockResolvedValueOnce([{ avg_days: 60 }]);

      mockDb.BibleStudent.findAll.mockResolvedValue([]);

      const result = await baptismPipelineService.getPipelineMetrics('c1');

      expect(result.funnel.studying).toBe(10);
      expect(result.funnel.candidates).toBe(5);
      expect(result.funnel.baptized).toBe(3);
      expect(result.funnel.fullMember).toBe(2);
    });

    it('handles empty database (all zeros)', async () => {
      mockDb.BibleStudent.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);

      mockDb.sequelize.query
        .mockResolvedValueOnce([{ avg_days: null }])
        .mockResolvedValueOnce([{ avg_days: null }]);

      mockDb.BibleStudent.findAll.mockResolvedValue([]);

      const result = await baptismPipelineService.getPipelineMetrics(null);

      expect(result.funnel.studying).toBe(0);
      expect(result.funnel.candidates).toBe(0);
      expect(result.funnel.baptized).toBe(0);
      expect(result.funnel.fullMember).toBe(0);
      expect(result.conversionRates.overall).toBe(0);
    });

    it('calculates conversion rates correctly', async () => {
      mockDb.BibleStudent.count
        .mockResolvedValueOnce(10)  // studying
        .mockResolvedValueOnce(5)   // candidates
        .mockResolvedValueOnce(3)   // baptized
        .mockResolvedValueOnce(2);  // fullMember

      mockDb.sequelize.query
        .mockResolvedValueOnce([{ avg_days: 30 }])
        .mockResolvedValueOnce([{ avg_days: 60 }]);

      mockDb.BibleStudent.findAll.mockResolvedValue([]);

      const result = await baptismPipelineService.getPipelineMetrics('c1');

      // totalStarted = 10 + 5 + 3 = 18
      // overall = (2 / 18) * 100 = 11.1
      expect(result.conversionRates.overall).toBe(11.1);
      // baptizedToMember = (2 / 3) * 100 = 66.7
      expect(result.conversionRates.baptizedToMember).toBe(66.7);
    });
  });

  describe('getLessonCompletionStats', () => {
    it('returns completion data', async () => {
      mockDb.sequelize.fn.mockReturnValue('mock_fn');
      mockDb.sequelize.col.mockReturnValue('mock_col');
      mockDb.sequelize.cast.mockReturnValue('mock_cast');

      mockDb.BibleLessonProgress.findAll.mockResolvedValue([{
        totalLessons: 20,
        completedLessons: 12,
        avgScore: 85.5,
      }]);

      const result = await baptismPipelineService.getLessonCompletionStats('c1');

      expect(result.totalLessons).toBe(20);
      expect(result.completedLessons).toBe(12);
      expect(result.completionRate).toBe(60);
      expect(result.avgScore).toBe(85.5);
    });

    it('handles no lessons (all zeros)', async () => {
      mockDb.sequelize.fn.mockReturnValue('mock_fn');
      mockDb.sequelize.col.mockReturnValue('mock_col');
      mockDb.sequelize.cast.mockReturnValue('mock_cast');

      mockDb.BibleLessonProgress.findAll.mockResolvedValue([{
        totalLessons: 0,
        completedLessons: 0,
        avgScore: null,
      }]);

      const result = await baptismPipelineService.getLessonCompletionStats(null);

      expect(result.totalLessons).toBe(0);
      expect(result.completedLessons).toBe(0);
      expect(result.completionRate).toBe(0);
      expect(result.avgScore).toBeNull();
    });
  });
});
