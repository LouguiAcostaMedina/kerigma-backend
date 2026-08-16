import { describe, expect, it } from 'vitest';
import { toTitleCase } from '../../src/utils/text';

describe('toTitleCase', () => {
  it('capitaliza cada palabra', () => {
    expect(toTitleCase('LIMA')).toBe('Lima');
    expect(toTitleCase('san juan de lurigancho')).toBe('San Juan de Lurigancho');
  });

  it('mantiene en minúscula las palabras menores (de/del/la/los/y)', () => {
    expect(toTitleCase('la libertad')).toBe('La Libertad');
    expect(toTitleCase('los olivos y miraflores')).toBe('Los Olivos y Miraflores');
  });

  it('normaliza espacios múltiples y trim', () => {
    expect(toTitleCase('   callao   ')).toBe('Callao');
  });

  it('capitaliza "san" y "santa" en nombres propios (no son palabras menores)', () => {
    expect(toTitleCase('de san martin')).toBe('De San Martin');
    expect(toTitleCase('santa rosa')).toBe('Santa Rosa');
  });
});
