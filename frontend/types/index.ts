export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  avg_pace?: number;
  total_runs: number;
  total_miles: number;
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

export interface Run {
  id: string;
  user_id: string;
  name: string;
  distance: number;
  duration: string;
  pace: string;
  date: string;
}
