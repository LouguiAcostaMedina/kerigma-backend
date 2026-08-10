import { describe, expect, it } from 'vitest';
import {
  clampPct,
  goalProgressPercent,
  memberGrowthPercent,
  missionPillarPercent,
  pctOf,
  toNumber,
} from '../../src/utils/dashboardMath';

describe('dashboardMath', () => {
  describe('clampPct', () => {
    it('acota el valor entre 0 y 100 redondeando a 1 decimal', () => {
      expect(clampPct(0)).toBe(0);
      expect(clampPct(100)).toBe(100);
      expect(clampPct(120)).toBe(100);
      expect(clampPct(-5)).toBe(0);
      expect(clampPct(33.333)).toBe(33.3);
      expect(clampPct(55.555)).toBe(55.6);
    });
  });

  describe('pctOf (pilar Comunión y Relacionamiento)', () => {
    it('devuelve 0 cuando el denominador es cero', () => {
      expect(pctOf(5, 0)).toBe(0);
      expect(pctOf(0, 0)).toBe(0);
    });

    it('calcula el porcentaje correcto', () => {
      expect(pctOf(0, 10)).toBe(0);
      expect(pctOf(5, 10)).toBe(50);
      expect(pctOf(1, 3)).toBe(33.3);
      expect(pctOf(2, 3)).toBe(66.7);
      expect(pctOf(3, 4)).toBe(75);
    });

    it('nunca supera 100% aunque el numerador exceda el denominador', () => {
      expect(pctOf(4, 3)).toBe(100);
      expect(pctOf(10, 1)).toBe(100);
    });
  });

  describe('missionPillarPercent (pilar Misión)', () => {
    it('evita la división por cero', () => {
      expect(missionPillarPercent(0, 0, 0)).toBe(0);
    });

    it('combina parejas activas y estudiantes en curso', () => {
      expect(missionPillarPercent(3, 2, 10)).toBe(50);
      expect(missionPillarPercent(5, 5, 10)).toBe(100);
      expect(missionPillarPercent(2, 1, 4)).toBe(75);
    });

    it('acota el resultado a 100', () => {
      expect(missionPillarPercent(10, 10, 1)).toBe(100);
    });
  });

  describe('toNumber', () => {
    it('convierte valores nulos, numéricos y de texto', () => {
      expect(toNumber(null)).toBe(0);
      expect(toNumber(undefined)).toBe(0);
      expect(toNumber(42)).toBe(42);
      expect(toNumber('12.5')).toBe(12.5);
      expect(toNumber('abc')).toBe(0);
      expect(toNumber('')).toBe(0);
    });
  });

  describe('goalProgressPercent', () => {
    it('calcula el avance de una meta', () => {
      expect(goalProgressPercent(5, 10)).toBe(50);
      expect(goalProgressPercent(10, 10)).toBe(100);
      expect(goalProgressPercent(15, 10)).toBe(100);
    });

    it('devuelve 0 cuando la meta no tiene objetivo', () => {
      expect(goalProgressPercent(5, 0)).toBe(0);
    });
  });

  describe('memberGrowthPercent', () => {
    it('calcula el crecimiento porcentual trimestre a trimestre', () => {
      expect(memberGrowthPercent(100, 120)).toBe(20);
      expect(memberGrowthPercent(50, 60)).toBe(20);
    });

    it('devuelve 0 cuando no hay trimestre anterior o el resultado es negativo', () => {
      expect(memberGrowthPercent(0, 10)).toBe(0);
      expect(memberGrowthPercent(100, 80)).toBe(0);
      expect(memberGrowthPercent(200, 100)).toBe(0);
    });
  });
});
