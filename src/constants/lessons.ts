export const BIBLE_LESSON_TITLES: readonly string[] = [
  'La Salvación',
  'El Bautismo',
  'La Oración',
  'La Palabra de Dios',
  'La Iglesia',
  'La Comunión',
  'La Mayordomía',
  'El Discipulado',
  'La Santidad',
  'La Fe',
  'El Fruto del Espíritu',
  'La Gran Comisión',
  'El Servicio Cristiano',
  'La Adoración',
  'El Perdón',
  'Las Relaciones',
  'La Familia',
  'El Trabajo y la Vocación',
  'La Esperanza y la Perseverancia',
  'La Madurez Espiritual',
];

export const TOTAL_BIBLE_LESSONS = BIBLE_LESSON_TITLES.length;

export const GRADUATION_THRESHOLD_PERCENT = 80;

export const MIN_LESSONS_TO_GRADUATE = Math.ceil((GRADUATION_THRESHOLD_PERCENT * TOTAL_BIBLE_LESSONS) / 100);
