export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  avg_pace?: number;
  avg_jog_minutes?: number;
  avg_distance_km?: number;
  total_runs: number;
  total_km: number;
  created_at: string;
}

export interface Runner {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  pace?: number;
  direction: number;
  is_active: boolean;
  last_update: string;
  user?: User;
}

export interface Match {
  id: string;
  runner1Id: string;
  runner2Id: string;
  matchScore: number;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RunHistoryEntry {
  id: string;
  partnerId: string;
  partnerUsername: string;
  start: RoutePoint;
  end: RoutePoint;
  path: RoutePoint[];
  distanceKm: number | null;
  durationMinutes: number | null;
  avgPaceKmh: number | null;
  avgHeartRateBpm: number | null;
  caloriesKcal: number | null;
  endedAt: string;
}
