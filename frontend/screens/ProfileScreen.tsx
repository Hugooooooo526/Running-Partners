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
import GlassCard from '../components/GlassCard';

const RECENT_RUNS = [
  {
    id: '1',
    name: 'Morning Tempo Run',
    distance: '6.2 mi',
    duration: '48:12',
    pace: '7\'46"/mi',
  },
  {
    id: '2',
    name: 'Recovery Beach Trail',
    distance: '4.0 mi',
    duration: '35:00',
    pace: '8\'45"/mi',
  },
];

const ProfileScreen: React.FC = () => {
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
              <Text style={styles.avatarText}>ER</Text>
            </View>
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <Text style={styles.editIcon}>✏️</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>EliteRunner99</Text>
          <View style={styles.badgeRow}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO MEMBER</Text>
            </View>
            <Text style={styles.joinDate}>• JOINED JAN 2023</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            label="TOTAL RUNS"
            value="142"
            subtitle="+12 THIS MONTH"
            icon="🏃"
            wide
          />
          <StatCard
            label="TOTAL MILES"
            value="1,248"
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
              <Text style={styles.paceValue}>7'42"</Text>
              <Text style={styles.paceUnit}>/mi</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Runs</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.seeAll}>SEE ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.runsList}>
          {RECENT_RUNS.map((run, index) => (
            <TouchableOpacity
              key={run.id}
              activeOpacity={0.8}
              style={[styles.runCard, index === 1 && styles.runCardFaded]}
            >
              <View style={styles.runThumbnail}>
                <Text style={styles.runThumbnailIcon}>📍</Text>
              </View>
              <View style={styles.runInfo}>
                <Text style={styles.runName}>{run.name}</Text>
                <View style={styles.runStats}>
                  <Text style={styles.runStat}>{run.distance}</Text>
                  <Text style={styles.runStat}>{run.duration}</Text>
                  <Text style={styles.runStat}>{run.pace}</Text>
                </View>
              </View>
              <Text style={styles.runChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logButton} activeOpacity={0.8}>
          <Text style={styles.logButtonIcon}>➕</Text>
          <Text style={styles.logButtonText}>LOG NEW ACTIVITY</Text>
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
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primaryContainer,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: Colors.background,
  },
  editIcon: {
    fontSize: 14,
  },
  username: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    backgroundColor: 'rgba(195, 244, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryFixedDim,
    letterSpacing: 0.5,
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
  seeAll: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  runsList: {
    gap: 12,
  },
  runCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(44, 44, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 4,
  },
  runCardFaded: {
    opacity: 0.8,
  },
  runThumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  runThumbnailIcon: {
    fontSize: 24,
  },
  runInfo: {
    flex: 1,
  },
  runName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  runStats: {
    flexDirection: 'row',
    gap: 12,
  },
  runStat: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
  },
  runChevron: {
    fontSize: 24,
    color: Colors.onSurfaceVariant,
    opacity: 0.4,
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
});

export default ProfileScreen;
