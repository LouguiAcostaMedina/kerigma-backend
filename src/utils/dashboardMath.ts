export function clampPct(value: number): number {
  const rounded = Math.round(value * 10) / 10;
  return Math.min(100, Math.max(0, rounded));
}

export function pctOf(numerator: number, denominator: number): number {
  if (denominator <= 0) {
    return 0;
  }
  return clampPct((numerator / denominator) * 100);
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function missionPillarPercent(activePairs: number, studentsInProgress: number, activeMembers: number): number {
  const denominator = Math.max(1, activeMembers);
  return clampPct(((activePairs + studentsInProgress) / denominator) * 100);
}

export function goalProgressPercent(achieved: number, target: number): number {
  return target > 0 ? clampPct((achieved / target) * 100) : 0;
}

export function memberGrowthPercent(previousQuarterMembers: number, currentQuarterMembers: number): number {
  const growthAbsolute = currentQuarterMembers - previousQuarterMembers;
  return previousQuarterMembers > 0 ? clampPct((growthAbsolute / previousQuarterMembers) * 100) : 0;
}
