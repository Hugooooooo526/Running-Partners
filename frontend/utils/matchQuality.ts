import { Colors } from '../theme';

export interface ComparableStats {
  avgPace: number | null;
  avgDistanceKm: number | null;
  avgJogMinutes: number | null;
}

const STAT_WEIGHTS: Record<keyof ComparableStats, number> = {
  avgPace: 0.5,
  avgDistanceKm: 0.25,
  avgJogMinutes: 0.25,
};

function statSimilarity(a: number, b: number): number {
  const avg = (a + b) / 2;
  if (avg === 0) return 1;
  return 1 - Math.min(1, Math.abs(a - b) / avg);
}

export function computeMatchScore(a: ComparableStats, b: ComparableStats): number | null {
  let weightedSum = 0;
  let weightTotal = 0;

  (Object.keys(STAT_WEIGHTS) as (keyof ComparableStats)[]).forEach((key) => {
    const va = a[key];
    const vb = b[key];
    if (va == null || vb == null) return;
    const weight = STAT_WEIGHTS[key];
    weightedSum += statSimilarity(va, vb) * weight;
    weightTotal += weight;
  });

  if (weightTotal === 0) return null;
  return Math.round((weightedSum / weightTotal) * 100);
}

const STAT_ORDER: (keyof ComparableStats)[] = ['avgPace', 'avgDistanceKm', 'avgJogMinutes'];

type Tier = 'similar' | 'somewhat different' | 'very different';

function tierOf(relDiff: number): Tier {
  if (relDiff < 0.15) return 'similar';
  if (relDiff <= 0.35) return 'somewhat different';
  return 'very different';
}

function phraseFor(key: keyof ComparableStats, tier: Tier, higher: boolean): string {
  const prefix = tier === 'very different' ? 'much' : tier === 'somewhat different' ? 'a little' : '';
  switch (key) {
    case 'avgPace':
      return `runs ${[prefix, higher ? 'faster' : 'slower'].filter(Boolean).join(' ')} than you`;
    case 'avgDistanceKm':
      return `prefers ${[prefix, higher ? 'longer' : 'shorter'].filter(Boolean).join(' ')} distances`;
    case 'avgJogMinutes':
      return `usually runs ${[prefix, higher ? 'longer' : 'shorter'].filter(Boolean).join(' ')} sessions`;
    default:
      return '';
  }
}

const STAT_LABELS: Record<keyof ComparableStats, string> = {
  avgPace: 'pace',
  avgDistanceKm: 'distance',
  avgJogMinutes: 'run duration',
};

export function getMatchSummary(self: ComparableStats, other: ComparableStats, score: number): string {
  const available = STAT_ORDER.filter((key) => self[key] != null && other[key] != null);
  if (available.length === 0) return '';

  const fitLevel = score >= 80 ? 'Great fit' : score >= 60 ? 'Good fit' : score >= 40 ? 'Fair fit' : 'Poor fit';

  const diffs = available.map((key) => {
    const a = self[key] as number;
    const b = other[key] as number;
    const avg = (a + b) / 2;
    const relDiff = avg === 0 ? 0 : Math.abs(b - a) / avg;
    return { key, tier: tierOf(relDiff), higher: b > a };
  });

  if (diffs.every((d) => d.tier === 'similar')) {
    const labels = available.map((key) => STAT_LABELS[key]);
    const joined =
      labels.length === 1
        ? labels[0]
        : `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
    return `${fitLevel} — closely matched ${joined}.`;
  }

  const standoutPhrases = diffs
    .filter((d) => d.tier !== 'similar')
    .slice(0, 2)
    .map((d) => phraseFor(d.key, d.tier, d.higher));

  const joinedPhrases =
    standoutPhrases.length === 1
      ? standoutPhrases[0]
      : `${standoutPhrases[0]} and ${standoutPhrases[1]}`;

  return `${fitLevel} — ${joinedPhrases}.`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const MATCH_STOPS: { score: number; rgb: [number, number, number] }[] = [
  { score: 0, rgb: hexToRgb(Colors.matchPoor) },
  { score: 50, rgb: hexToRgb(Colors.matchFair) },
  { score: 100, rgb: hexToRgb(Colors.matchGreat) },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getMatchColor(score: number): string {
  const clamped = Math.min(100, Math.max(0, score));
  const [lo, hi] = clamped <= 50 ? [MATCH_STOPS[0], MATCH_STOPS[1]] : [MATCH_STOPS[1], MATCH_STOPS[2]];
  const t = clamped <= 50 ? clamped / 50 : (clamped - 50) / 50;
  const r = Math.round(lerp(lo.rgb[0], hi.rgb[0], t));
  const g = Math.round(lerp(lo.rgb[1], hi.rgb[1], t));
  const b = Math.round(lerp(lo.rgb[2], hi.rgb[2], t));
  return `rgb(${r}, ${g}, ${b})`;
}
