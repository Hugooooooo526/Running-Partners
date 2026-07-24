import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../theme';
import TopBar from '../components/TopBar';
import StatCard from '../components/StatCard';
import { useAuth } from '../hooks/useAuth';

const ProfileScreen: React.FC = () => {
  const { profile, signOut } = useAuth();

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
            subtitle="LIFETIME TOTAL"
            icon="🏃"
            wide
          />
          <StatCard
            label="TOTAL MILES"
            value={profile.total_miles.toLocaleString()}
            subtitle="LIFETIME VOLUME"
            icon="🗺️"
            wide
          />
          <View style={styles.paceCardWide}>
            <View style={styles.paceHeader}>
              <Text style={styles.paceLabel}>AVERAGE PACE</Text>
              <Text style={styles.paceIcon}>⚡</Text>
            </View>
            <View style={styles.paceValueRow}>
              <Text style={styles.paceValue}>{profile.avg_pace ? profile.avg_pace : '--'}</Text>
              {profile.avg_pace != null && <Text style={styles.paceUnit}>/mi</Text>}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
        </View>

        <View style={styles.emptyRuns}>
          <Text style={styles.emptyRunsIcon}>📍</Text>
          <Text style={styles.emptyRunsText}>No runs logged yet</Text>
          <Text style={styles.emptyRunsSubtext}>Log your first run to see it here</Text>
        </View>

        <TouchableOpacity style={styles.logButton} activeOpacity={0.8}>
          <Text style={styles.logButtonIcon}>➕</Text>
          <Text style={styles.logButtonText}>LOG NEW ACTIVITY</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={signOut}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
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
