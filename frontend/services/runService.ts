import { supabase } from './supabaseClient';
import { RoutePoint, RunHistoryEntry } from '../types';

interface RunInviteRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  path: RoutePoint[] | null;
  distance_km: number | null;
  duration_minutes: number | null;
  avg_pace_kmh: number | null;
  avg_heart_rate_bpm: number | null;
  calories_kcal: number | null;
  ended_at: string;
}

export async function fetchRunHistory(userId: string): Promise<RunHistoryEntry[]> {
  console.log('[fetchRunHistory] Fetching runs for user:', userId);
  
  const { data, error } = await supabase
    .from('run_invites')
    .select(
      'id, sender_id, receiver_id, start_latitude, start_longitude, end_latitude, end_longitude, path, distance_km, duration_minutes, avg_pace_kmh, avg_heart_rate_bpm, calories_kcal, ended_at'
    )
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as RunInviteRow[];
  
  console.log('[fetchRunHistory] Raw data from database:', {
    rowCount: rows.length,
    rows: rows.map(r => ({
      id: r.id,
      pathType: typeof r.path,
      pathIsArray: Array.isArray(r.path),
      pathLength: Array.isArray(r.path) ? r.path.length : 'N/A',
      path: r.path,
    })),
  });
  
  if (rows.length === 0) return [];

  const partnerIds = Array.from(
    new Set(rows.map((r) => (r.sender_id === userId ? r.receiver_id : r.sender_id)))
  );
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username')
    .in('id', partnerIds);

  if (usersError) throw usersError;
  const usernameById = new Map(
    (users ?? []).map((u: { id: string; username: string }) => [u.id, u.username])
  );

  const result = rows.map((r) => {
    const partnerId = r.sender_id === userId ? r.receiver_id : r.sender_id;
    
    // Helper to safely convert to number, returning null for NaN
    const toNumber = (val: any): number | null => {
      if (val == null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };
    
    const pathArray = (r.path ?? []).map((p) => ({
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
    }));
    
    console.log('[fetchRunHistory] Processed run:', {
      id: r.id,
      rawPath: r.path,
      pathArrayLength: pathArray.length,
      pathArray: pathArray,
    });
    
    return {
      id: r.id,
      partnerId,
      partnerUsername: usernameById.get(partnerId) ?? 'Runner',
      start: { latitude: Number(r.start_latitude), longitude: Number(r.start_longitude) },
      end: { latitude: Number(r.end_latitude), longitude: Number(r.end_longitude) },
      path: pathArray,
      distanceKm: toNumber(r.distance_km),
      durationMinutes: toNumber(r.duration_minutes),
      avgPaceKmh: toNumber(r.avg_pace_kmh),
      avgHeartRateBpm: toNumber(r.avg_heart_rate_bpm),
      caloriesKcal: toNumber(r.calories_kcal),
      endedAt: r.ended_at,
    };
  });
  
  console.log('[fetchRunHistory] Returning', result.length, 'runs');
  return result;
}

interface CompleteRunValues {
  path: RoutePoint[];
  distanceKm: number;
  durationMinutes: number;
  avgPaceKmh: number;
  avgHeartRateBpm: number;
  caloriesKcal: number;
}

export async function completeRun(inviteId: string, values: CompleteRunValues): Promise<void> {
  console.log('[completeRun] Updating run_invite:', {
    inviteId,
    pathLength: values.path.length,
    path: values.path,
    distanceKm: values.distanceKm,
    durationMinutes: values.durationMinutes,
  });
  
  const { error } = await supabase
    .from('run_invites')
    .update({
      ended_at: new Date().toISOString(),
      path: values.path,
      distance_km: values.distanceKm,
      duration_minutes: values.durationMinutes,
      avg_pace_kmh: values.avgPaceKmh,
      avg_heart_rate_bpm: values.avgHeartRateBpm,
      calories_kcal: values.caloriesKcal,
    })
    .eq('id', inviteId);

  if (error) {
    console.error('[completeRun] Database error:', error);
    throw error;
  }
  
  console.log('[completeRun] ✅ Successfully updated database');
}
