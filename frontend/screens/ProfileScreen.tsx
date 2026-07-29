import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius } from '../theme';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import SurveyNumberInput from '../components/SurveyNumberInput';
import LeafletMap from '../components/LeafletMap';
import { useAuth } from '../hooks/useAuth';
import { updateSurveyProfile } from '../services/authService';
import { fetchRunHistory } from '../services/runService';
import { RunHistoryEntry } from '../types';

function formatJogTime(totalMinutes?: number): string {
  if (totalMinutes == null) return '--';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

const ProfileScreen: React.FC = () => {
  const { profile, signOut, session, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [paceKmh, setPaceKmh] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [runHistory, setRunHistory] = useState<RunHistoryEntry[]>([]);
  const [selectedRun, setSelectedRun] = useState<RunHistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let cancelled = false;
      fetchRunHistory(session.user.id)
        .then((entries) => {
          if (!cancelled) setRunHistory(entries);
        })
        .catch((e) => console.error('Failed to load run history', e));
      return () => {
        cancelled = true;
      };
    }, [session])
  );

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

  const startEditing = () => {
    const totalMinutes = profile.avg_jog_minutes ?? 0;
    setHours(String(Math.floor(totalMinutes / 60)));
    setMinutes(String(totalMinutes % 60));
    setDistanceKm(profile.avg_distance_km != null ? String(profile.avg_distance_km) : '');
    setPaceKmh(profile.avg_pace != null ? String(profile.avg_pace) : '');
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    const h = Number(hours);
    const m = Number(minutes);
    const distance = Number(distanceKm);
    const pace = Number(paceKmh);

    if (hours === '' || minutes === '' || distanceKm === '' || paceKmh === '') {
      setError('Please fill in all fields');
      return;
    }
    if ([h, m, distance, pace].some((n) => Number.isNaN(n) || n < 0)) {
      setError('Please enter valid, non-negative numbers');
      return;
    }
    if (m > 59) {
      setError('Minutes must be between 0 and 59');
      return;
    }
    if (!session) return;

    setSaving(true);
    try {
      await updateSurveyProfile(session.user.id, {
        avgJogMinutes: h * 60 + m,
        avgDistanceKm: distance,
        avgPace: pace,
      });
      await refreshProfile();
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

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
            icon="🏃"
            wide
          />
          <StatCard
            label="TOTAL MILES"
            value={profile.total_miles.toLocaleString()}
            icon="🗺️"
            wide
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Running Preferences</Text>
          {!editing && (
            <TouchableOpacity onPress={startEditing} activeOpacity={0.7}>
              <Text style={styles.editLink}>EDIT</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.surveyForm}>
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <SurveyNumberInput label="HOURS" value={hours} onChangeText={setHours} unit="h" />
              </View>
              <View style={styles.rowItem}>
                <SurveyNumberInput label="MINUTES" value={minutes} onChangeText={setMinutes} unit="min" />
              </View>
            </View>
            <SurveyNumberInput
              label="AVERAGE DISTANCE"
              value={distanceKm}
              onChangeText={setDistanceKm}
              unit="km"
            />
            <SurveyNumberInput label="AVERAGE PACE" value={paceKmh} onChangeText={setPaceKmh} unit="km/h" />

            {error && <Text style={styles.error}>{error}</Text>}

            <View style={styles.editActionsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                activeOpacity={0.8}
                onPress={() => setEditing(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.submitButtonDisabled]}
                activeOpacity={0.8}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.onPrimaryContainer} />
                ) : (
                  <Text style={styles.saveButtonText}>SAVE</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="AVG JOG TIME"
              value={formatJogTime(profile.avg_jog_minutes)}
              subtitle="PER SESSION"
              icon="⏱️"
              wide
            />
            <StatCard
              label="AVG DISTANCE"
              value={profile.avg_distance_km != null ? `${profile.avg_distance_km} km` : '--'}
              subtitle="PER SESSION"
              icon="🗺️"
              wide
            />
            <View style={styles.paceCardWide}>
              <View style={styles.paceHeader}>
                <Text style={styles.paceLabel}>AVERAGE PACE</Text>
                <Text style={styles.paceIcon}>⚡</Text>
              </View>
              <View style={styles.paceValueRow}>
                <Text style={styles.paceValue}>{profile.avg_pace != null ? profile.avg_pace : '--'}</Text>
                {profile.avg_pace != null && <Text style={styles.paceUnit}>km/h</Text>}
              </View>
            </View>
          </View>
        )}

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
                onPress={() => setSelectedRun(run)}
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
                onPress={() => setSelectedRun(null)}
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
                route={null}
                path={selectedRun.path.length > 0 ? selectedRun.path : [selectedRun.start, selectedRun.end]}
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
                  {new Date(selectedRun.endedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
                <Text style={styles.modalStatLabel}>DATE</Text>
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
  paceCardWide: {
    flexBasis: '100%',
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  paceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  paceIcon: {
    fontSize: 18,
    color: Colors.primaryContainer,
    opacity: 0.4,
  },
  paceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  paceValue: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 52,
  },
  paceUnit: {
    fontSize: 16,
    color: Colors.onSurfaceVariant,
  },
  editLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  surveyForm: {
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    padding: 20,
    gap: 16,
    marginBottom: 32,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rowItem: {
    flex: 1,
  },
  error: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: 'rgba(30, 31, 35, 0.8)',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
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
