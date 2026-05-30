/**
 * Canonical equipment list. Stored on the user (`hardware: string[]`) and
 * referenced by event `gearRequired`/`gearCritical`, so these exact strings
 * must be the single source used by BOTH the admin event editor and the
 * profile settings — otherwise owned-gear matching on event detail breaks.
 */
export const ALL_HARDWARE = [
  'Kask',
  'Czekan',
  'Raki koszykowe',
  'Raki półautomatyczne',
  'Raki automatyczne',
  'Raczki',
  'Uprząż',
  'Lonża',
  'Detektor Lawinowy',
  'Sonda',
  'Łopata',
  'Lina',
  'Karabinki',
  'Buty zimowe',
  'Kurtka puchowa',
  'Śpiwór letni',
  'Śpiwór zimowy',
  'Namiot',
  'Hamak',
  'Karimata/Materac',
  'Poddupnik',
] as const;
