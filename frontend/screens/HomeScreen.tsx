import React, { useState } from 'react';
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

const DEMO_RUNNERS = [
  { id: '1', username: 'SARAH', latitude: 1.3021, longitude: 103.8198, pace: "8'10\"", distance: '0.5 mi' },
  { id: '2', username: 'MARCUS', latitude: 1.2975, longitude: 103.8550, pace: "7'20\"", distance: '0.8 mi' },
  { id: '3', username: 'ALEX', latitude: 1.2998, longitude: 103.8374, pace: "7'45\"", distance: '0.2 mi' },
];

const HomeScreen: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState<typeof DEMO_RUNNERS[number] | null>(null);
  const [runnerCount] = useState(5);
  const { location: userLocation } = useLocation();

  const handleRunnerPress = (id: string) => {
    const runner = DEMO_RUNNERS.find((r) => r.id === id);
    if (runner) setSelectedRunner(runner);
  };

  const handleMapPress = () => {
    setSelectedRunner(null);
  };

  return (
    <View style={styles.container}>
      <TopBar />

      <LeafletMap
        runners={DEMO_RUNNERS}
        selectedRunnerId={selectedRunner?.id ?? null}
        onRunnerPress={handleRunnerPress}
        onMapPress={handleMapPress}
        userLocation={userLocation}
      />

      <OnlineToggleButton
        isOnline={isOnline}
        onToggle={() => setIsOnline((prev) => !prev)}
        style={styles.toggleButton}
      />

      <View style={styles.chipContainer}>
        <View style={styles.chip}>
          <View style={styles.chipDot} />
          <Text style={styles.chipText}>{runnerCount} RUNNERS NEARBY</Text>
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
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{selectedRunner.username}</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>PRO COACH</Text>
                  </View>
                </View>
                <Text style={styles.cardDistance}>
                  {selectedRunner.distance} away • Active Now
                </Text>
              </View>
            </View>
            <View style={styles.cardPace}>
              <Text style={styles.paceLabel}>PACE</Text>
              <Text style={styles.paceValue}>{selectedRunner.pace}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>STREAK</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statIcon}>🔥</Text>
                <Text style={styles.statValue}>12 Days</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>GOAL</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statIcon}>📈</Text>
                <Text style={styles.statValue}>5k Run</Text>
              </View>
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
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  badge: {
    backgroundColor: 'rgba(195, 244, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    padding: 12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginBottom: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
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
