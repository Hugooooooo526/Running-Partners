// Estimates for metrics the app doesn't record with a sensor.
//
// Heart rate and calories burned are approximations derived from the pace and
// distance of a completed run. They assume a body weight of 70 kg and are
// documented as estimates — tune the constants below if better data arrives.

const ASSUMED_WEIGHT_KG = 70;
const METERS_PER_KM = 1000;

// Random prototyping values for a single session so the dashboard charts have
// something plausible to plot before real sensors or estimates are wired in.
// Called once per completed run; the result is persisted with the run.
export function randomRunMetrics(): {
  paceKmh: number;
  avgBpm: number;
  caloriesKcal: number;
} {
  const paceKmh = Math.round((6 + Math.random() * 8) * 10) / 10;
  const avgBpm = Math.round(120 + Math.random() * 60);
  const caloriesKcal = Math.round(150 + Math.random() * 650);
  return { paceKmh, avgBpm, caloriesKcal };
}

export function estimatePaceKmh(distanceKm: number, durationMinutes: number): number {
  if (distanceKm <= 0 || durationMinutes <= 0) return 0;
  return distanceKm / (durationMinutes / 60);
}

// ACSM formula: kcal = MET * 3.5 * weightKg / 200 * minutes
// MET is a linear fit of Compendium running METs: 3.5 + 0.833 * speedMph.
export function estimateCaloriesKcal(
  distanceKm: number,
  durationMinutes: number,
  paceKmh: number
): number {
  if (distanceKm <= 0 || durationMinutes <= 0 || paceKmh <= 0) return 0;
  const speedMph = paceKmh / 1.609344;
  const met = 3.5 + 0.833 * speedMph;
  return Math.round((met * 3.5 * ASSUMED_WEIGHT_KG * durationMinutes) / 200);
}

// Linear model mapping jogging pace to an average heart rate, clamped to a
// realistic jogging range.
export function estimateAvgBpm(paceKmh: number): number {
  if (paceKmh <= 0) return 0;
  const bpm = 125 + (paceKmh - 6) * 7;
  return Math.round(Math.min(185, Math.max(110, bpm)));
}

export { METERS_PER_KM };
