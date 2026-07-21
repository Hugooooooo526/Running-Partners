// Global type definitions

export interface User {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  createdAt: string;
}

export interface Runner {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  pace: number;
  direction: number;
  isActive: boolean;
  lastUpdate: string;
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
