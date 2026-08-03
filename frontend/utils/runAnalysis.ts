export interface RunAnalysisInput {
  distanceKm: number | null;
  durationMinutes: number | null;
  paceKmh: number | null;
  bpm: number | null;
  kcal: number | null;
}

export interface RunAnalysis {
  headline: string;
  notes: string[];
}

const PACE_NOTES = [
  'You kept an easy, conversational pace — great for recovery and building a base.',
  'A steady, comfortable pace — solid endurance work.',
  'A brisk pace — you were pushing the tempo nicely.',
  'A fast pace — that was a serious effort!',
];

function paceTier(paceKmh: number): 0 | 1 | 2 | 3 {
  if (paceKmh < 7) return 0;
  if (paceKmh < 9.5) return 1;
  if (paceKmh < 11.5) return 2;
  return 3;
}

function heartRateTier(bpm: number): 0 | 1 | 2 | 3 {
  if (bpm < 130) return 0;
  if (bpm < 150) return 1;
  if (bpm < 170) return 2;
  return 3;
}

const HEADLINES = ['Easy recovery run', 'Solid steady effort', 'Vigorous workout', 'Intense session'];

export function getRunAnalysis(input: RunAnalysisInput): RunAnalysis | null {
  const { paceKmh, bpm, kcal } = input;
  if (paceKmh == null && bpm == null && kcal == null) return null;

  const notes: string[] = [];
  let pTier: 0 | 1 | 2 | 3 | null = null;
  let hTier: 0 | 1 | 2 | 3 | null = null;

  if (paceKmh != null && paceKmh > 0) {
    pTier = paceTier(paceKmh);
    notes.push(PACE_NOTES[pTier]);
  }

  if (bpm != null && bpm > 0) {
    hTier = heartRateTier(bpm);
    const hrDescriptions = [
      'stayed in a low, easy zone',
      'sat in a healthy aerobic zone — good for cardio fitness',
      'was in the vigorous zone — a strong workout for your heart',
      'was very high — make sure to rest and hydrate well',
    ];
    notes.push(`Average heart rate of ${Math.round(bpm)} bpm ${hrDescriptions[hTier]}.`);
  }

  if (kcal != null && kcal > 0) {
    notes.push(`You burned roughly ${Math.round(kcal)} kcal this session.`);
  }

  const headline =
    pTier == null && hTier == null ? 'Run logged' : HEADLINES[Math.max(pTier ?? 0, hTier ?? 0)];

  return { headline, notes };
}
