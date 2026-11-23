/**
 * CK3 fame/prestige accumulated-experience thresholds.
 * @type {{threshold: number, name: string}[]}
 */
export const FAME_LEVELS = [
  { threshold: 0, name: 'Disgraced' },
  { threshold: 1000, name: 'Established' },
  { threshold: 2000, name: 'Distinguished' },
  { threshold: 5000, name: 'Illustrious' },
  { threshold: 10000, name: 'Exalted Among Men' },
  { threshold: 20000, name: 'Legendary Figure' },
]

/**
 * CK3 piety accumulated-experience thresholds.
 * @type {{threshold: number, name: string}[]}
 */
export const PIETY_LEVELS = [
  { threshold: 0, name: 'Sinner' },
  { threshold: 1000, name: 'Dutiful' },
  { threshold: 1500, name: 'Faithful' },
  { threshold: 2500, name: 'Devoted Servant' },
  { threshold: 4500, name: 'Paragon of Virtue' },
  { threshold: 8500, name: 'Religious Icon' },
]
