import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import TopBar from '../components/TopBar';
import GlassCard from '../components/GlassCard';
import OnlineToggleButton from '../components/OnlineToggleButton';
import LeafletMap from '../components/LeafletMap';
import LocationSearchInput from '../components/LocationSearchInput';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { completeRun } from '../services/runService';
import { getDistanceKm, formatDistanceKm } from '../utils/distance';
import { randomRunMetrics } from '../utils/runEstimates';

interface RemoteRunner {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  pace: number | null;
  avgJogMinutes: number | null;
  avgDistanceKm: number | null;
  avgPace: number | null;
}

interface RunnerProfile {
  username: string;
  avgJogMinutes: number | null;
  avgDistanceKm: number | null;
  avgPace: number | null;
}

interface RunnerRow {
  user_id: string;
  latitude: number;
  longitude: number;
  pace: number | null;
  user: {
    username: string;
    avg_jog_minutes: number | null;
    avg_distance_km: number | null;
    avg_pace: number | null;
  } | null;
}

interface IncomingInvite {
  id: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  senderPace: number | null;
  senderTotalRuns: number;
  senderTotalKm: number;
  start: RoutePoint | null;
  end: RoutePoint | null;
}

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface RouteDraft {
  targetId: string;
  targetUsername: string;
  start: RoutePoint | null;
  end: RoutePoint | null;
  startLabel: string | null;
  endLabel: string | null;
  activeField: 'start' | 'end';
}

interface ActiveSession {
  inviteId: string;
  partnerId: string;
  partnerUsername: string;
  start: RoutePoint;
  end: RoutePoint;
  startedAt: number;
}

const MIN_SYNC_MOVE_METERS = 5; // Reduced from 15 to capture more path detail
const MIN_SYNC_INTERVAL_MS = 5_000; // Reduced from 10s to 5s for better tracking
const METERS_PER_KM = 1000;

// Breadcrumb recording: push a point when the runner moves this far from the
// last recorded point, OR when this much time has elapsed since it, so a slow
// or stopping runner still leaves a continuous trail instead of the recorded
// path collapsing into a straight start->end line.
const MIN_TRACK_MOVE_METERS = 5;
const MAX_TRACK_GAP_MS = 10_000;

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const char of padded) {
    if (char === '=') break;
    const value = BASE64_CHARS.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return decodeURIComponent(
    output
      .split('')
      .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('')
  );
}

function decodeJwtClaims(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(base64UrlDecode(payload));
  } catch (e) {
    return null;
  }
}

function formatJogTime(totalMinutes?: number): string {
  if (totalMinutes == null) return '--';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

const HomeScreen: React.FC = () => {
  const { session } = useAuth();
  const { location: userLocation, errorMsg: locationErrorMsg } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);
  const [remoteRunners, setRemoteRunners] = useState<RemoteRunner[]>([]);
  const [incomingInvite, setIncomingInvite] = useState<IncomingInvite | null>(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [routeDraft, setRouteDraft] = useState<RouteDraft | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const isOnlineRef = useRef(isOnline);
  const lastSyncedRef = useRef<{ latitude: number; longitude: number; at: number } | null>(null);
  const upsertInFlightRef = useRef(false);
  const pendingSentInvitesRef = useRef<Map<string, string>>(new Map());
  const pathRef = useRef<RoutePoint[]>([]);
  const lastTrackedAtRef = useRef(0);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  // Seed remoteRunners with an initial fetch, then keep it live via Realtime
  // so users who come online after this screen mounted still show up
  // without needing a manual refresh.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const usernameCache = new Map<string, RunnerProfile>();

    const upsertLocal = (
      row: { user_id: string; latitude: number; longitude: number; pace: number | null },
      profile: RunnerProfile
    ) => {
      setRemoteRunners((prev) => {
        const next: RemoteRunner = {
          id: row.user_id,
          username: profile.username,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          pace: row.pace != null ? Number(row.pace) : null,
          avgJogMinutes: profile.avgJogMinutes,
          avgDistanceKm: profile.avgDistanceKm,
          avgPace: profile.avgPace,
        };
        const idx = prev.findIndex((r) => r.id === row.user_id);
        if (idx === -1) return [...prev, next];
        const copy = prev.slice();
        copy[idx] = next;
        return copy;
      });
    };

    const removeLocal = (userId: string) => {
      setRemoteRunners((prev) => prev.filter((r) => r.id !== userId));
    };

    const handleChange = async (payload: any) => {
      if (payload.eventType === 'DELETE') {
        const oldUserId = payload.old?.user_id;
        if (oldUserId) removeLocal(oldUserId);
        return;
      }

      const row = payload.new as {
        user_id: string;
        is_active: boolean;
        latitude: number;
        longitude: number;
        pace: number | null;
      };
      if (row.user_id === session.user.id) return;
      if (!row.is_active) {
        removeLocal(row.user_id);
        return;
      }

      const cached = usernameCache.get(row.user_id);
      if (cached) {
        upsertLocal(row, cached);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('username, avg_jog_minutes, avg_distance_km, avg_pace')
        .eq('id', row.user_id)
        .single();

      if (error || !data) {
        console.error('Failed to resolve profile for runner', row.user_id, error);
        return;
      }
      const profile: RunnerProfile = {
        username: data.username,
        avgJogMinutes: data.avg_jog_minutes != null ? Number(data.avg_jog_minutes) : null,
        avgDistanceKm: data.avg_distance_km != null ? Number(data.avg_distance_km) : null,
        avgPace: data.avg_pace != null ? Number(data.avg_pace) : null,
      };
      usernameCache.set(row.user_id, profile);
      if (!cancelled) upsertLocal(row, profile);
    };

    const channel = supabase
      .channel('runners-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runners' }, handleChange)
      .subscribe();

    (async () => {
      const { data, error } = await supabase
        .from('runners')
        .select('user_id, latitude, longitude, pace, user:users(username, avg_jog_minutes, avg_distance_km, avg_pace)')
        .eq('is_active', true)
        .neq('user_id', session.user.id);

      if (error) {
        console.error('Failed to load nearby runners', error);
        return;
      }
      if (cancelled || !data) return;

      const rows = data as unknown as RunnerRow[];
      rows.forEach((r) => {
        if (!r.user) return;
        usernameCache.set(r.user_id, {
          username: r.user.username,
          avgJogMinutes: r.user.avg_jog_minutes != null ? Number(r.user.avg_jog_minutes) : null,
          avgDistanceKm: r.user.avg_distance_km != null ? Number(r.user.avg_distance_km) : null,
          avgPace: r.user.avg_pace != null ? Number(r.user.avg_pace) : null,
        });
      });
      setRemoteRunners(
        rows
          .filter((r) => r.user)
          .map((r) => ({
            id: r.user_id,
            username: r.user!.username,
            latitude: r.latitude,
            longitude: r.longitude,
            pace: r.pace,
            avgJogMinutes: r.user!.avg_jog_minutes != null ? Number(r.user!.avg_jog_minutes) : null,
            avgDistanceKm: r.user!.avg_distance_km != null ? Number(r.user!.avg_distance_km) : null,
            avgPace: r.user!.avg_pace != null ? Number(r.user!.avg_pace) : null,
          }))
      );
    })();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  // Live invite handling: show incoming invites as they arrive, and notify
  // the sender when their invite is accepted/declined.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    const handleIncoming = async (payload: any) => {
      const row = payload.new as {
        id: string;
        sender_id: string;
        status: string;
        start_latitude: number | null;
        start_longitude: number | null;
        end_latitude: number | null;
        end_longitude: number | null;
      };
      if (row.status !== 'pending') return;

      const { data, error } = await supabase
        .from('users')
        .select('username, avatar_url, avg_pace, total_runs, total_km')
        .eq('id', row.sender_id)
        .single();

      if (error || !data || cancelled) return;
      const start =
        row.start_latitude != null && row.start_longitude != null
          ? { latitude: Number(row.start_latitude), longitude: Number(row.start_longitude) }
          : null;
      const end =
        row.end_latitude != null && row.end_longitude != null
          ? { latitude: Number(row.end_latitude), longitude: Number(row.end_longitude) }
          : null;
      setIncomingInvite({
        id: row.id,
        senderId: row.sender_id,
        senderUsername: data.username,
        senderAvatarUrl: data.avatar_url,
        senderPace: data.avg_pace != null ? Number(data.avg_pace) : null,
        senderTotalRuns: data.total_runs ?? 0,
        senderTotalKm: data.total_km ?? 0,
        start,
        end,
      });
    };

    const handleEndedElsewhere = (row: { id: string; ended_at: string | null }) => {
      if (row.ended_at) {
        setActiveSession((cur) => {
          if (cur?.inviteId !== row.id) return cur;
          pathRef.current = [];
          lastTrackedAtRef.current = 0;
          return null;
        });
        return true;
      }
      return false;
    };

    const handleSentInviteUpdate = (payload: any) => {
      const row = payload.new as {
        id: string;
        status: string;
        ended_at: string | null;
        receiver_id: string;
        start_latitude: number;
        start_longitude: number;
        end_latitude: number;
        end_longitude: number;
      };
      if (handleEndedElsewhere(row)) return;

      const username = pendingSentInvitesRef.current.get(row.id);
      if (row.status === 'accepted') {
        const startPoint = { latitude: Number(row.start_latitude), longitude: Number(row.start_longitude) };
        // Seed the recorded path with where the user actually is, not the
        // pinned route start — the pinned point can be far from the runner.
        const currentLoc = userLocationRef.current;
        pathRef.current = currentLoc ? [{ ...currentLoc }] : [];
        lastTrackedAtRef.current = Date.now();
        setActiveSession({
          inviteId: row.id,
          partnerId: row.receiver_id,
          partnerUsername: username ?? 'your runner',
          start: startPoint,
          end: { latitude: Number(row.end_latitude), longitude: Number(row.end_longitude) },
          startedAt: Date.now(),
        });
        pendingSentInvitesRef.current.delete(row.id);
      } else if (row.status === 'declined') {
        Alert.alert('Invite declined', `${username ?? 'They'} declined your invite.`);
        pendingSentInvitesRef.current.delete(row.id);
      }
    };

    const handleReceivedInviteUpdate = (payload: any) => {
      const row = payload.new as { id: string; ended_at: string | null };
      handleEndedElsewhere(row);
    };

    const channel = supabase
      .channel('run-invites')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'run_invites',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        handleIncoming
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'run_invites',
          filter: `sender_id=eq.${session.user.id}`,
        },
        handleSentInviteUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'run_invites',
          filter: `receiver_id=eq.${session.user.id}`,
        },
        handleReceivedInviteUpdate
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  const syncRunnerLocation = useCallback(
    async (loc: { latitude: number; longitude: number }, force = false) => {
      if (!session) return;
      const last = lastSyncedRef.current;
      const movedMeters = last ? getDistanceKm(last, loc) * METERS_PER_KM : Infinity;
      const elapsedMs = last ? Date.now() - last.at : Infinity;
      if (!force && last && movedMeters < MIN_SYNC_MOVE_METERS && elapsedMs < MIN_SYNC_INTERVAL_MS) {
        return;
      }
      if (upsertInFlightRef.current) return;

      upsertInFlightRef.current = true;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      console.log('[diagnostic] session.user.id =', session.user.id);
      console.log('[diagnostic] token present =', !!token, 'length =', token?.length);
      console.log('[diagnostic] token claims =', token ? decodeJwtClaims(token) : null);
      const { error } = await supabase.from('runners').upsert(
        {
          user_id: session.user.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          is_active: isOnlineRef.current,
          last_update: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
      upsertInFlightRef.current = false;

      if (error) {
        console.error('Failed to sync runner location', error);
        return;
      }
      lastSyncedRef.current = { latitude: loc.latitude, longitude: loc.longitude, at: Date.now() };
    },
    [session]
  );

  useEffect(() => {
    if (userLocation) syncRunnerLocation(userLocation);
  }, [userLocation, syncRunnerLocation]);

  // Record GPS breadcrumbs for the active jog so the completed route can be
  // saved to run history once the jog ends. A point is kept when the runner
  // moves >= MIN_TRACK_MOVE_METERS from the last one, or when >= MAX_TRACK_GAP_MS
  // has elapsed, so a slow/stopped runner still leaves a continuous trail.
  useEffect(() => {
    console.log('[GPS Tracking] Effect triggered', {
      hasActiveSession: !!activeSession,
      hasUserLocation: !!userLocation,
      userLocation,
      currentPathLength: pathRef.current.length,
    });

    if (!activeSession || !userLocation) return;

    const now = Date.now();
    const last = pathRef.current[pathRef.current.length - 1];

    if (!last) {
      pathRef.current.push({ ...userLocation });
      lastTrackedAtRef.current = now;
      return;
    }

    const movedMeters = getDistanceKm(last, userLocation) * METERS_PER_KM;
    const timeSinceLast = now - lastTrackedAtRef.current;

    if (movedMeters >= MIN_TRACK_MOVE_METERS || timeSinceLast >= MAX_TRACK_GAP_MS) {
      pathRef.current.push({ ...userLocation });
      lastTrackedAtRef.current = now;
      console.log('[GPS Tracking] ✅ GPS point recorded:', {
        totalPoints: pathRef.current.length,
        movedMeters: movedMeters.toFixed(1),
        timeSinceLastMs: timeSinceLast,
        location: userLocation,
      });
    }
  }, [userLocation, activeSession]);

  const runners = useMemo(
    () =>
      remoteRunners.map((r) => ({
        id: r.id,
        username: r.username,
        latitude: r.latitude,
        longitude: r.longitude,
        pace: r.pace != null ? `${r.pace.toFixed(1)} km/h` : '--',
        distance: userLocation
          ? formatDistanceKm(getDistanceKm(userLocation, r))
          : '--',
        avgJogMinutes: r.avgJogMinutes,
        avgDistanceKm: r.avgDistanceKm,
        avgPace: r.avgPace,
      })),
    [remoteRunners, userLocation]
  );

  const selectedRunner = runners.find((r) => r.id === selectedRunnerId) ?? null;

  const handleRunnerPress = (id: string) => {
    setSelectedRunnerId(id);
  };

  const setRouteDraftPoint = (field: 'start' | 'end', point: RoutePoint, label: string) => {
    setRouteDraft((cur) => {
      if (!cur) return cur;
      const other = field === 'start' ? 'end' : 'start';
      const next: RouteDraft = {
        ...cur,
        [field]: point,
        [field === 'start' ? 'startLabel' : 'endLabel']: label,
      };
      next.activeField = cur[other] ? field : other;
      return next;
    });
  };

  const handleMapPress = (lat: number, lng: number) => {
    if (routeDraft) {
      setRouteDraftPoint(
        routeDraft.activeField,
        { latitude: lat, longitude: lng },
        `Pinned location (${lat.toFixed(4)}, ${lng.toFixed(4)})`
      );
      return;
    }
    setSelectedRunnerId(null);
  };

  const handleInviteToJog = () => {
    if (!selectedRunner) return;
    setRouteDraft({
      targetId: selectedRunner.id,
      targetUsername: selectedRunner.username,
      start: null,
      end: null,
      startLabel: null,
      endLabel: null,
      activeField: 'start',
    });
  };

  const handleCancelRouteDraft = () => {
    setRouteDraft(null);
  };

  const handleStartJog = async () => {
    if (!session || !routeDraft || !routeDraft.start || !routeDraft.end) return;
    const { targetId, targetUsername, start, end } = routeDraft;

    const { data, error } = await supabase
      .from('run_invites')
      .insert({
        sender_id: session.user.id,
        receiver_id: targetId,
        status: 'pending',
        start_latitude: start.latitude,
        start_longitude: start.longitude,
        end_latitude: end.latitude,
        end_longitude: end.longitude,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        Alert.alert('Invite already sent', `You already have a pending invite with ${targetUsername}.`);
      } else {
        console.error('Failed to send invite', error);
        Alert.alert('Something went wrong', 'Could not send the invite. Please try again.');
      }
      return;
    }

    if (data) pendingSentInvitesRef.current.set(data.id, targetUsername);
    setRouteDraft(null);
    Alert.alert('Invite sent', `Waiting for ${targetUsername} to respond.`);
  };

  const respondToInvite = async (accept: boolean) => {
    if (!incomingInvite) return;
    const invite = incomingInvite;
    setIncomingInvite(null);
    setInviteVisible(false);

    const { data, error } = await supabase
      .from('run_invites')
      .update({ status: accept ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
      .eq('id', invite.id)
      .select('start_latitude, start_longitude, end_latitude, end_longitude')
      .single();

    if (error) {
      console.error('Failed to respond to invite', error);
      Alert.alert('Something went wrong', 'Could not respond to the invite. Please try again.');
      return;
    }

    if (accept && data) {
      const startPoint = { latitude: Number(data.start_latitude), longitude: Number(data.start_longitude) };
      // Seed the recorded path with where the user actually is, not the
      // pinned route start — the pinned point can be far from the runner.
      const currentLoc = userLocationRef.current;
      pathRef.current = currentLoc ? [{ ...currentLoc }] : [];
      lastTrackedAtRef.current = Date.now();
      setActiveSession({
        inviteId: invite.id,
        partnerId: invite.senderId,
        partnerUsername: invite.senderUsername,
        start: startPoint,
        end: { latitude: Number(data.end_latitude), longitude: Number(data.end_longitude) },
        startedAt: Date.now(),
      });
    }
  };

  const handleEndJog = async () => {
    if (!activeSession) return;
    const session_ = activeSession;
    const recordedPath = [...pathRef.current]; // Create a copy
    
    console.log('[End Jog] Starting end jog process:', {
      sessionId: session_.inviteId,
      recordedPathLength: recordedPath.length,
      recordedPath: recordedPath,
    });
    
    // Add the endpoint if it's not already close to the last recorded point
    if (userLocation && recordedPath.length > 0) {
      const lastPoint = recordedPath[recordedPath.length - 1];
      const distToEnd = getDistanceKm(lastPoint, userLocation) * METERS_PER_KM;
      console.log('[End Jog] Checking if we should add endpoint:', {
        lastPoint,
        currentLocation: userLocation,
        distToEnd: distToEnd.toFixed(1),
        threshold: MIN_SYNC_MOVE_METERS,
      });
      if (distToEnd >= MIN_SYNC_MOVE_METERS) {
        recordedPath.push({ ...userLocation });
        console.log('[End Jog] Added endpoint to path');
      }
    }
    
    setActiveSession(null);
    pathRef.current = [];
    lastTrackedAtRef.current = 0;

    console.log('[End Jog] Path details:', {
      recordedPathLength: recordedPath.length,
      sessionStart: session_.start,
      sessionEnd: session_.end,
    });

    const path = recordedPath.length > 0 ? recordedPath : [session_.start, session_.end];
    console.log('[End Jog] Final path to save:', {
      pathLength: path.length,
      usingRecordedPath: recordedPath.length > 0,
      path: path,
    });
    
    let distanceKm = 0;
    for (let i = 1; i < path.length; i++) {
      distanceKm += getDistanceKm(path[i - 1], path[i]);
    }
    const durationMinutes = Math.max(1, Math.round((Date.now() - session_.startedAt) / 60000));
    const metrics = randomRunMetrics();

    console.log('[End Jog] Computed metrics:', {
      pathLength: path.length,
      distanceKm: distanceKm.toFixed(2),
      durationMinutes,
      metrics,
    });

    try {
      console.log('[End Jog] Calling completeRun with:', {
        inviteId: session_.inviteId,
        path,
        distanceKm: Number(distanceKm.toFixed(2)),
        durationMinutes,
        avgPaceKmh: metrics.paceKmh,
      });
      
      await completeRun(session_.inviteId, {
        path,
        distanceKm: Number(distanceKm.toFixed(2)),
        durationMinutes,
        avgPaceKmh: metrics.paceKmh,
        avgHeartRateBpm: metrics.avgBpm,
        caloriesKcal: metrics.caloriesKcal,
      });
      console.log('[End Jog] ✅ Run completed successfully');
    } catch (error) {
      console.error('[End Jog] ❌ Failed to end jog:', error);
      setActiveSession(session_);
      pathRef.current = recordedPath;
      Alert.alert('Something went wrong', 'Could not end the jog. Please try again.');
    }
  };

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    isOnlineRef.current = next;
    if (!session) return;

    if (userLocation) {
      await syncRunnerLocation(userLocation, true);
    } else {
      const { error } = await supabase
        .from('runners')
        .update({ is_active: next })
        .eq('user_id', session.user.id);
      if (error) console.error('Failed to update online status', error);
    }
  };

  const mapRunners = activeSession
    ? runners.filter((r) => r.id === activeSession.partnerId)
    : runners;

  const mapRoute = activeSession
    ? { start: activeSession.start, end: activeSession.end }
    : routeDraft
    ? { start: routeDraft.start, end: routeDraft.end }
    : null;

  return (
    <View style={styles.container}>
      <TopBar
        hasNotifications={!!incomingInvite && !activeSession && !routeDraft}
        onNotificationsPress={() => {
          if (incomingInvite && !activeSession && !routeDraft) setInviteVisible(true);
        }}
      />

      {locationErrorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {locationErrorMsg} — you won't appear to other runners until location is enabled.
          </Text>
        </View>
      )}

      <LeafletMap
        runners={mapRunners}
        selectedRunnerId={selectedRunnerId}
        onRunnerPress={handleRunnerPress}
        onMapPress={handleMapPress}
        userLocation={userLocation}
        route={mapRoute}
      />

      <OnlineToggleButton
        isOnline={isOnline}
        onToggle={handleToggleOnline}
        style={styles.toggleButton}
      />

      <View style={styles.chipContainer}>
        <View style={styles.chip}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>
            {activeSession
              ? `RUNNING WITH ${activeSession.partnerUsername.toUpperCase()}`
              : `${mapRunners.length} RUNNERS NEARBY`}
          </Text>
        </View>
      </View>

      {activeSession && (
        <GlassCard style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>
                  {activeSession.partnerUsername[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.cardName}>{activeSession.partnerUsername}</Text>
                <Text style={styles.cardDistance}>Jog in progress</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.endJogButton} activeOpacity={0.8} onPress={handleEndJog}>
            <Text style={styles.endJogText}>END JOG</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      {!activeSession && routeDraft && (
        <GlassCard style={styles.bottomCard}>
          <Text style={styles.cardName}>{routeDraft.targetUsername}</Text>

          <View style={styles.routeSearchGroup}>
            <LocationSearchInput
              label="FROM"
              placeholder="Search a starting point"
              active={routeDraft.activeField === 'start'}
              externalValue={routeDraft.startLabel}
              onFocus={() => setRouteDraft((cur) => (cur ? { ...cur, activeField: 'start' } : cur))}
              onPick={(point, label) => setRouteDraftPoint('start', point, label)}
            />
            <LocationSearchInput
              label="TO"
              placeholder="Search an ending point"
              active={routeDraft.activeField === 'end'}
              externalValue={routeDraft.endLabel}
              onFocus={() => setRouteDraft((cur) => (cur ? { ...cur, activeField: 'end' } : cur))}
              onPick={(point, label) => setRouteDraftPoint('end', point, label)}
            />
          </View>

          <Text style={styles.cardDistance}>
            {routeDraft.start && routeDraft.end
              ? 'Route ready — press START to send the invite'
              : `Tap the map to drop a pin for ${routeDraft.activeField === 'start' ? 'FROM' : 'TO'}, or search above`}
          </Text>

          <View style={styles.inviteActionsRow}>
            <TouchableOpacity
              style={styles.declineButton}
              activeOpacity={0.8}
              onPress={handleCancelRouteDraft}
            >
              <Text style={styles.declineText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                (!routeDraft.start || !routeDraft.end) && styles.acceptButtonDisabled,
              ]}
              activeOpacity={0.8}
              disabled={!routeDraft.start || !routeDraft.end}
              onPress={handleStartJog}
            >
              <Text style={styles.inviteText}>START</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {!activeSession && !routeDraft && selectedRunner && (
        <GlassCard style={styles.bottomCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={styles.cardAvatar}>
                <Text style={styles.cardAvatarText}>
                  {selectedRunner.username[0]}
                </Text>
              </View>
              <View>
                <Text style={styles.cardName}>{selectedRunner.username}</Text>
                <Text style={styles.cardDistance}>
                  {selectedRunner.distance} away • Online
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.runnerStatsRow}>
            <View style={styles.runnerStat}>
              <Text style={styles.runnerStatValue}>
                {formatJogTime(selectedRunner.avgJogMinutes ?? undefined)}
              </Text>
              <Text style={styles.runnerStatLabel}>AVG TIME</Text>
            </View>
            <View style={styles.runnerStat}>
              <Text style={styles.runnerStatValue}>
                {selectedRunner.avgDistanceKm != null
                  ? `${selectedRunner.avgDistanceKm.toFixed(1)} km`
                  : '--'}
              </Text>
              <Text style={styles.runnerStatLabel}>AVG DIST</Text>
            </View>
            <View style={styles.runnerStat}>
              <Text style={styles.runnerStatValue}>
                {selectedRunner.avgPace != null
                  ? `${selectedRunner.avgPace.toFixed(1)} km/h`
                  : '--'}
              </Text>
              <Text style={styles.runnerStatLabel}>AVG PACE</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.inviteButton} activeOpacity={0.8} onPress={handleInviteToJog}>
            <Text style={styles.inviteIcon}>🏃</Text>
            <Text style={styles.inviteText}>INVITE TO JOG</Text>
          </TouchableOpacity>
        </GlassCard>
      )}

      <Modal
        visible={inviteVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setInviteVisible(false)}
      >
        {incomingInvite && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>RUN INVITATION</Text>

              <View style={styles.cardHeaderLeft}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>{incomingInvite.senderUsername[0]}</Text>
                </View>
                <View>
                  <Text style={styles.cardName}>{incomingInvite.senderUsername}</Text>
                  <Text style={styles.cardDistance}>wants to run with you</Text>
                </View>
              </View>

              <View style={styles.inviteStatsRow}>
                <View style={styles.inviteStat}>
                  <Text style={styles.inviteStatValue}>
                    {incomingInvite.senderTotalKm.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </Text>
                  <Text style={styles.inviteStatLabel}>TOTAL KM</Text>
                </View>
                <View style={styles.inviteStat}>
                  <Text style={styles.inviteStatValue}>
                    {incomingInvite.senderPace != null ? incomingInvite.senderPace.toFixed(1) : '--'}
                  </Text>
                  <Text style={styles.inviteStatLabel}>AVG KM/H</Text>
                </View>
                <View style={styles.inviteStat}>
                  <Text style={styles.inviteStatValue}>{incomingInvite.senderTotalRuns}</Text>
                  <Text style={styles.inviteStatLabel}>RUNS</Text>
                </View>
              </View>

              {incomingInvite.start && incomingInvite.end && (
                <View style={styles.inviteMap}>
                  <LeafletMap
                    runners={[]}
                    selectedRunnerId={null}
                    onRunnerPress={() => {}}
                    onMapPress={() => {}}
                    userLocation={null}
                    route={{ start: incomingInvite.start, end: incomingInvite.end }}
                  />
                </View>
              )}

              <View style={styles.inviteActionsRow}>
                <TouchableOpacity
                  style={styles.declineButton}
                  activeOpacity={0.8}
                  onPress={() => respondToInvite(false)}
                >
                  <Text style={styles.declineText}>DECLINE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  activeOpacity={0.8}
                  onPress={() => respondToInvite(true)}
                >
                  <Text style={styles.inviteText}>ACCEPT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  toggleButton: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 30,
  },
  errorBanner: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.containerMargin,
    right: Spacing.containerMargin,
    zIndex: 40,
    backgroundColor: Colors.errorContainer,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  errorBannerText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onErrorContainer,
    fontWeight: '600',
  },
  chipContainer: {
    position: 'absolute',
    top: 150,
    alignSelf: 'center',
    zIndex: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 14, 18, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    gap: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryContainer,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurface,
    letterSpacing: 0.5,
  },
  bottomCard: {
    position: 'absolute',
    bottom: 80,
    left: Spacing.containerMargin,
    right: Spacing.containerMargin,
    zIndex: 30,
  },
  routeSearchGroup: {
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  cardAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardDistance: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  cardPace: {
    alignItems: 'flex-end',
  },
  paceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  paceValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primaryContainer,
  },
  runnerStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  runnerStat: {
    alignItems: 'center',
    flex: 1,
  },
  runnerStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  runnerStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    marginTop: 16,
    gap: 8,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  inviteIcon: {
    fontSize: 18,
  },
  endJogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorContainer,
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    marginTop: 16,
  },
  endJogText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onErrorContainer,
    letterSpacing: 0.5,
  },
  inviteText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceContainer,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.surfaceVariant,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.labelCaps,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  inviteStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inviteStat: {
    alignItems: 'center',
    flex: 1,
  },
  inviteStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  inviteStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  inviteMap: {
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  inviteActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  declineText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  acceptButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
  },
  acceptButtonDisabled: {
    opacity: 0.4,
  },
});

export default HomeScreen;
