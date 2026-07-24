import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { Colors, Spacing, BorderRadius } from '../theme';
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

const HomeScreen: React.FC = () => {
  const { session } = useAuth();
  const { location: userLocation } = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRunnerId, setSelectedRunnerId] = useState<string | null>(null);
  const [remoteRunners, setRemoteRunners] = useState<RemoteRunner[]>([]);
  const hasSyncedLocationRef = useRef(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('runners')
        .select('user_id, latitude, longitude, pace, user:users(username)')
        .eq('is_active', true)
        .neq('user_id', session.user.id);

      if (cancelled || !data) return;

      const rows = data as unknown as RunnerRow[];
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
    };
  }, [session]);

  useEffect(() => {
    if (!session || !userLocation || hasSyncedLocationRef.current) return;
    hasSyncedLocationRef.current = true;

    supabase.from('runners').upsert(
      {
        user_id: session.user.id,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        is_active: isOnline,
        last_update: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  }, [session, userLocation]);

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
    if (!session) return;
    await supabase.from('runners').update({ is_active: next }).eq('user_id', session.user.id);
  };

  return (
    <View style={styles.container}>
      <TopBar />

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
