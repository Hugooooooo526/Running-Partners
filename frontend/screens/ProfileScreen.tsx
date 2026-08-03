import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius } from '../theme';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import LeafletMap from '../components/LeafletMap';
import { useAuth } from '../hooks/useAuth';
import { fetchRunHistory } from '../services/runService';
import { RunHistoryEntry } from '../types';
import LineChart, { ChartPoint } from '../components/LineChart';
import { estimatePaceKmh, estimateCaloriesKcal, estimateAvgBpm } from '../utils/runEstimates';
import { getRunAnalysis } from '../utils/runAnalysis';

function formatJogTime(totalMinutes?: number): string {
  if (totalMinutes == null) return '--';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

// Prefer the metrics logged when the run ended, and fall back to estimates for
// older runs that predate the logging columns.
function runMetrics(run: RunHistoryEntry): {
  paceKmh: number | null;
  bpm: number | null;
  kcal: number | null;
} {
  const { distanceKm, durationMinutes } = run;
  
  // If we have logged metrics, use them regardless of distance/duration validity
  if (run.avgPaceKmh != null) {
    const pace = run.avgPaceKmh;
    console.log('Using logged pace:', pace, typeof pace);
    return {
      paceKmh: pace,
      bpm: run.avgHeartRateBpm ?? estimateAvgBpm(pace),
      kcal: run.caloriesKcal ?? (
        distanceKm != null && durationMinutes != null && distanceKm > 0 && durationMinutes > 0
          ? estimateCaloriesKcal(distanceKm, durationMinutes, pace)
          : null
      ),
    };
  }
  
  // Otherwise, try to estimate from distance and duration
  if (distanceKm != null && durationMinutes != null && distanceKm > 0 && durationMinutes > 0) {
    const pace = estimatePaceKmh(distanceKm, durationMinutes);
    console.log('Estimated pace from distance/duration:', pace, distanceKm, durationMinutes);
    return {
      paceKmh: pace,
      bpm: estimateAvgBpm(pace),
      kcal: estimateCaloriesKcal(distanceKm, durationMinutes, pace),
    };
  }
  
  // No valid data available
  console.log('No valid pace data:', { distanceKm, durationMinutes, avgPaceKmh: run.avgPaceKmh });
  return { paceKmh: null, bpm: null, kcal: null };
}

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  series: ChartPoint[];
  formatValue: (value: number) => string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtitle,
  series,
  formatValue,
}) => {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
      </View>
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
      <LineChart series={series} formatValue={formatValue} />
    </View>
  );
};

const ProfileScreen: React.FC = () => {
  const { profile, signOut, session } = useAuth();
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunHistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      fetchRunHistory(session.user.id)
        .then((entries) => {
          if (!cancelled) {
            console.log('Run history fetched:', entries.length, 'runs');
            entries.forEach((run, i) => {
              console.log(`Run ${i}:`, {
                distanceKm: run.distanceKm,
                durationMinutes: run.durationMinutes,
                avgPaceKmh: run.avgPaceKmh,
                avgHeartRateBpm: run.avgHeartRateBpm,
                caloriesKcal: run.caloriesKcal,
              });
            });
            setRunHistory(entries);
          }
        })
        .catch((e) => console.error('Failed to load run history', e));
      return () => {
        cancelled = true;
      };
    }, [session])
  );

  const dashboard = useMemo(() => {
    const chronological = [...runHistory].sort(
      (a, b) => new Date(a.endedAt).getTime() - new Date(b.endedAt).getTime()
    );
    const shortDate = (iso: string) =>
      new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const jogTimeSeries: ChartPoint[] = [];
    const distanceSeries: ChartPoint[] = [];
    const paceSeries: ChartPoint[] = [];
    const bpmSeries: ChartPoint[] = [];
    const caloriesSeries: ChartPoint[] = [];

    let totalDistance = 0;
    let totalMinutes = 0;

    for (const run of chronological) {
      const { distanceKm, durationMinutes } = run;
      const label = shortDate(run.endedAt);
      const metrics = runMetrics(run);

      if (metrics.paceKmh != null && !isNaN(metrics.paceKmh) && metrics.paceKmh > 0) {
        paceSeries.push({ label, value: metrics.paceKmh });
      }
      if (metrics.bpm != null && !isNaN(metrics.bpm) && metrics.bpm > 0) {
        bpmSeries.push({ label, value: metrics.bpm });
      }
      if (metrics.kcal != null && !isNaN(metrics.kcal) && metrics.kcal > 0) {
        caloriesSeries.push({ label, value: metrics.kcal });
      }
      if (durationMinutes != null && !isNaN(durationMinutes) && durationMinutes > 0) {
        jogTimeSeries.push({ label, value: durationMinutes });
      }
      if (distanceKm != null && !isNaN(distanceKm) && distanceKm > 0) {
        distanceSeries.push({ label, value: distanceKm });
      }
      if (distanceKm != null && !isNaN(distanceKm)) totalDistance += distanceKm;
      if (durationMinutes != null && !isNaN(durationMinutes)) totalMinutes += durationMinutes;
    }

    const mean = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

    const result = {
      jogTimeSeries,
      distanceSeries,
      paceSeries,
      bpmSeries,
      caloriesSeries,
      avgJogMinutes: mean(jogTimeSeries.map((p) => p.value)),
      avgDistanceKm: mean(distanceSeries.map((p) => p.value)),
      avgPace: mean(paceSeries.map((p) => p.value)),
      avgBpm: mean(bpmSeries.map((p) => p.value)),
      avgCalories: mean(caloriesSeries.map((p) => p.value)),
    };

    console.log('Dashboard metrics:', {
      jogTimeSeries: jogTimeSeries.length,
      distanceSeries: distanceSeries.length,
      paceSeries: paceSeries.length,
      bpmSeries: bpmSeries.length,
      caloriesSeries: caloriesSeries.length,
      avgPace: result.avgPace,
      avgBpm: result.avgBpm,
      avgCalories: result.avgCalories,
    });

    return result;
  }, [runHistory]);

  const selectedRunMetrics = useMemo(
    () => (selectedRun ? runMetrics(selectedRun) : null),
    [selectedRun]
  );

  const selectedRunAnalysis = useMemo(
    () =>
      selectedRun && selectedRunMetrics
        ? getRunAnalysis({
            distanceKm: selectedRun.distanceKm,
            durationMinutes: selectedRun.durationMinutes,
            paceKmh: selectedRunMetrics.paceKmh,
            bpm: selectedRunMetrics.bpm,
            kcal: selectedRunMetrics.kcal,
          })
        : null,
    [selectedRun, selectedRunMetrics]
  );

  const dashboardCards: MetricCardProps[] = [
    {
      label: 'AVG JOG TIME',
      value: dashboard.avgJogMinutes != null ? formatJogTime(Math.round(dashboard.avgJogMinutes)) : '--',
      subtitle: 'PER SESSION',
      series: dashboard.jogTimeSeries,
      formatValue: (v) => formatJogTime(Math.round(v)),
    },
    {
      label: 'AVG DISTANCE',
      value: dashboard.avgDistanceKm != null ? `${dashboard.avgDistanceKm.toFixed(1)} km` : '--',
      subtitle: 'PER SESSION',
      series: dashboard.distanceSeries,
      formatValue: (v) => `${v.toFixed(1)} km`,
    },
    {
      label: 'AVG PACE',
      value: dashboard.avgPace != null ? `${dashboard.avgPace.toFixed(1)} km/h` : '--',
      subtitle: 'PER SESSION',
      series: dashboard.paceSeries,
      formatValue: (v) => `${v.toFixed(1)} km/h`,
    },
    {
      label: 'AVG HEART RATE',
      value: dashboard.avgBpm != null ? `${Math.round(dashboard.avgBpm)} bpm` : '--',
      subtitle: 'ESTIMATED',
      series: dashboard.bpmSeries,
      formatValue: (v) => `${Math.round(v)} bpm`,
    },
    {
      label: 'AVG CALORIES',
      value: dashboard.avgCalories != null ? `${Math.round(dashboard.avgCalories)} kcal` : '--',
      subtitle: 'ESTIMATED',
      series: dashboard.caloriesSeries,
      formatValue: (v) => `${Math.round(v)} kcal`,
    },
  ];

  if (!profile) {
    return (
      <View style={styles.container}>
        <TopBar />
      </View>
    );
  }

  const joinDate = new Date(profile.created_at)
    .toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    .toUpperCase();

  return (
    <View style={styles.container}>
      <TopBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.username[0].toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.username}>{profile.username}</Text>
          <Text style={styles.joinDate}>JOINED {joinDate}</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="TOTAL RUNS"
            value={String(profile.total_runs)}
            wide
          />
          <StatCard
            label="TOTAL KILOMETRES"
            value={profile.total_km.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            wide
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Dashboard</Text>
        </View>

        <View style={styles.dashboardList}>
          {dashboardCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>History</Text>
        </View>

        {runHistory.length === 0 ? (
          <View style={styles.emptyRuns}>
            <Text style={styles.emptyRunsIcon}>📍</Text>
            <Text style={styles.emptyRunsText}>No runs logged yet</Text>
            <Text style={styles.emptyRunsSubtext}>Log your first run to see it here</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {runHistory.map((run) => (
              <TouchableOpacity
                key={run.id}
                style={styles.historyCard}
                activeOpacity={0.8}
                onPress={() => {
                  console.log('Selected run:', {
                    id: run.id,
                    pathLength: run.path.length,
                    path: run.path,
                    start: run.start,
                    end: run.end,
                  });
                  setSelectedRun(run);
                }}
              >
                <View style={styles.historyCardLeft}>
                  <View style={styles.historyAvatar}>
                    <Text style={styles.historyAvatarText}>
                      {run.partnerUsername[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.historyPartner}>Ran with {run.partnerUsername}</Text>
                    <Text style={styles.historyMeta}>
                      {new Date(run.endedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      {run.distanceKm != null ? ` • ${run.distanceKm.toFixed(1)} km` : ''}
                      {run.durationMinutes != null ? ` • ${formatJogTime(run.durationMinutes)}` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={signOut}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={!!selectedRun}
        animationType="slide"
        onRequestClose={() => setSelectedRun(null)}
      >
        {selectedRun && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  console.log('Closing modal for run:', {
                    id: selectedRun.id,
                    pathLength: selectedRun.path.length,
                    path: selectedRun.path,
                    start: selectedRun.start,
                    end: selectedRun.end,
                  });
                  setSelectedRun(null);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Ran with {selectedRun.partnerUsername}</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            <View style={styles.modalMap}>
              <LeafletMap
                runners={[]}
                selectedRunnerId={null}
                onRunnerPress={() => {}}
                onMapPress={() => {}}
                userLocation={null}
                route={
                  selectedRun.path.length >= 3
                    ? null
                    : { start: selectedRun.start, end: selectedRun.end }
                }
                path={selectedRun.path.length >= 3 ? selectedRun.path : undefined}
              />
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {selectedRun.distanceKm != null ? selectedRun.distanceKm.toFixed(1) : '--'}
                </Text>
                <Text style={styles.modalStatLabel}>KM</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {selectedRun.durationMinutes != null ? formatJogTime(selectedRun.durationMinutes) : '--'}
                </Text>
                <Text style={styles.modalStatLabel}>TIME</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {selectedRunMetrics?.paceKmh != null
                    ? `${selectedRunMetrics.paceKmh.toFixed(1)}`
                    : '--'}
                </Text>
                <Text style={styles.modalStatLabel}>KM/H</Text>
              </View>
            </View>

            <View style={styles.modalStatsSecondary}>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {selectedRunMetrics?.bpm != null ? `${Math.round(selectedRunMetrics.bpm)}` : '--'}
                </Text>
                <Text style={styles.modalStatLabel}>AVG BPM</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {selectedRunMetrics?.kcal != null ? `${Math.round(selectedRunMetrics.kcal)}` : '--'}
                </Text>
                <Text style={styles.modalStatLabel}>KCAL</Text>
              </View>
              <View style={styles.modalStat}>
                <Text style={styles.modalStatValue}>
                  {new Date(selectedRun.endedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.modalStatLabel}>DATE</Text>
              </View>
            </View>

            {selectedRunAnalysis && (
              <View style={styles.aiCoachCard}>
                <Text style={styles.aiCoachLabel}>✨ AI COACH</Text>
                <Text style={styles.aiCoachHeadline}>{selectedRunAnalysis.headline}</Text>
                {selectedRunAnalysis.notes.map((note, index) => (
                  <Text key={index} style={styles.aiCoachNote}>
                    {note}
                  </Text>
                ))}
              </View>
            )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 104,
    paddingBottom: 100,
    paddingHorizontal: Spacing.containerMargin,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 24,
  },
  avatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.primary,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 32,
  },
  dashboardList: {
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    padding: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  metricIcon: {
    fontSize: 18,
    color: Colors.primaryContainer,
    opacity: 0.4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 36,
  },
  metricSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyRuns: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(44, 44, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    paddingVertical: 32,
  },
  emptyRunsIcon: {
    fontSize: 28,
    marginBottom: 8,
    opacity: 0.5,
  },
  emptyRunsText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  emptyRunsSubtext: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    marginTop: 4,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(44, 44, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: 14,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  historyPartner: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  historyMeta: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  historyChevron: {
    fontSize: 22,
    color: Colors.onSurfaceVariant,
    opacity: 0.6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.containerMargin,
    paddingBottom: Spacing.md,
  },
  modalClose: {
    fontSize: 20,
    color: Colors.onSurface,
    width: 24,
  },
  modalHeaderSpacer: {
    width: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalMap: {
    flex: 1,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
  },
  modalStatsSecondary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.containerMargin,
  },
  pathWarning: {
    marginHorizontal: Spacing.containerMargin,
    marginBottom: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  pathWarningText: {
    fontSize: 11,
    color: '#FFC107',
    textAlign: 'center',
    fontWeight: '600',
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalStatLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  aiCoachCard: {
    marginHorizontal: Spacing.containerMargin,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(195, 244, 0, 0.08)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(195, 244, 0, 0.25)',
  },
  aiCoachLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  aiCoachHeadline: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  aiCoachNote: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    marginTop: 32,
    gap: 8,
  },
  logButtonIcon: {
    fontSize: 18,
  },
  logButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: 'rgba(30, 31, 35, 0.8)',
    marginTop: 12,
    marginBottom: 24,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
});

export default ProfileScreen;
