import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import TopBar from '../components/TopBar';
import GlassCard from '../components/GlassCard';
import OnlineToggleButton from '../components/OnlineToggleButton';
import LeafletMap from '../components/LeafletMap';
import { useLocation } from '../hooks/useLocation';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { getDistanceMiles, formatDistanceMiles } from '../utils/distance';

interface RemoteRunner {
  id: string;
  username: string;
  latitude: number;
  longitude: number;
  pace: number | null;
}

interface RunnerRow {
  user_id: string;
  latitude: number;
  longitude: number;
  pace: number | null;
  user: { username: string } | null;
}

const MIN_SYNC_MOVE_METERS = 15;
const MIN_SYNC_INTERVAL_MS = 10_000;
const METERS_PER_MILE = 1609.344;

const HomeScreen: React.FC = () => {
  const { session } = useAuth();
  const { location: userLocation, errorMsg: locationErrorMsg } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);
  const [remoteRunners, setRemoteRunners] = useState<RemoteRunner[]>([]);
  const isOnlineRef = useRef(isOnline);
  const lastSyncedRef = useRef<{ latitude: number; longitude: number; at: number } | null>(null);
  const upsertInFlightRef = useRef(false);

  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  // Seed remoteRunners with an initial fetch, then keep it live via Realtime
  // so users who come online after this screen mounted still show up
  // without needing a manual refresh.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const usernameCache = new Map<string, string>();

    const upsertLocal = (
      row: { user_id: string; latitude: number; longitude: number; pace: number | null },
      username: string
    ) => {
      setRemoteRunners((prev) => {
        const next: RemoteRunner = {
          id: row.user_id,
          username,
          latitude: Number(row.latitude),
          longitude: Number(row.longitude),
          pace: row.pace != null ? Number(row.pace) : null,
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
        .select('username')
        .eq('id', row.user_id)
        .single();

      if (error || !data) {
        console.error('Failed to resolve username for runner', row.user_id, error);
        return;
      }
      usernameCache.set(row.user_id, data.username);
      if (!cancelled) upsertLocal(row, data.username);
    };

    const channel = supabase
      .channel('runners-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'runners' }, handleChange)
      .subscribe();

    (async () => {
      const { data, error } = await supabase
        .from('runners')
        .select('user_id, latitude, longitude, pace, user:users(username)')
        .eq('is_active', true)
        .neq('user_id', session.user.id);

      if (error) {
        console.error('Failed to load nearby runners', error);
        return;
      }
      if (cancelled || !data) return;

      const rows = data as unknown as RunnerRow[];
      rows.forEach((r) => {
        if (r.user) usernameCache.set(r.user_id, r.user.username);
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
          }))
      );
    })();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session]);

  const syncRunnerLocation = useCallback(
    async (loc: { latitude: number; longitude: number }, force = false) => {
      if (!session) return;
      const last = lastSyncedRef.current;
      const movedMeters = last ? getDistanceMiles(last, loc) * METERS_PER_MILE : Infinity;
      const elapsedMs = last ? Date.now() - last.at : Infinity;
      if (!force && last && movedMeters < MIN_SYNC_MOVE_METERS && elapsedMs < MIN_SYNC_INTERVAL_MS) {
        return;
      }
      if (upsertInFlightRef.current) return;

      upsertInFlightRef.current = true;
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

  const runners = useMemo(
    () =>
      remoteRunners.map((r) => ({
        id: r.id,
        username: r.username,
        latitude: r.latitude,
        longitude: r.longitude,
        pace: r.pace != null ? String(r.pace) : '--',
        distance: userLocation
          ? formatDistanceMiles(getDistanceMiles(userLocation, r))
          : '--',
      })),
    [remoteRunners, userLocation]
  );

  const selectedRunner = runners.find((r) => r.id === selectedRunnerId) ?? null;

  const handleRunnerPress = (id: string) => {
    setSelectedRunnerId(id);
  };

  const handleMapPress = () => {
    setSelectedRunnerId(null);
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

  return (
    <View style={styles.container}>
      <TopBar />

      {locationErrorMsg && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {locationErrorMsg} — you won't appear to other runners until location is enabled.
          </Text>
        </View>
      )}

      <LeafletMap
        runners={runners}
        selectedRunnerId={selectedRunnerId}
        onRunnerPress={handleRunnerPress}
        onMapPress={handleMapPress}
        userLocation={userLocation}
      />

      <OnlineToggleButton
        isOnline={isOnline}
        onToggle={handleToggleOnline}
        style={styles.toggleButton}
      />

      <View style={styles.chipContainer}>
        <View style={styles.chip}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>{runners.length} RUNNERS NEARBY</Text>
        </View>
      </View>

      {selectedRunner && (
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
            <View style={styles.cardPace}>
              <Text style={styles.paceLabel}>PACE</Text>
              <Text style={styles.paceValue}>{selectedRunner.pace}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.inviteButton} activeOpacity={0.8}>
            <Text style={styles.inviteIcon}>🏃</Text>
            <Text style={styles.inviteText}>INVITE TO JOG</Text>
          </TouchableOpacity>
        </GlassCard>
      )}
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
  inviteText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
});

export default HomeScreen;
