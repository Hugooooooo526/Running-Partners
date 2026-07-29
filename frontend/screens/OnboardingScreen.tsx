import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import GlassCard from '../components/GlassCard';
import SurveyNumberInput from '../components/SurveyNumberInput';
import { useAuth } from '../hooks/useAuth';
import { updateSurveyProfile } from '../services/authService';

const OnboardingScreen: React.FC = () => {
  const { session, refreshProfile } = useAuth();
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [distanceKm, setDistanceKm] = useState('');
  const [paceKmh, setPaceKmh] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
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
    if (!session) {
      setError('Your session expired — please sign in again');
      return;
    }

    setLoading(true);
    try {
      await updateSurveyProfile(session.user.id, {
        avgJogMinutes: h * 60 + m,
        avgDistanceKm: distance,
        avgPace: pace,
      });
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>TELL US ABOUT YOUR RUNS</Text>
        <Text style={styles.subtitle}>This helps us match you with the right running partners</Text>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionLabel}>AVERAGE JOGGING TIME</Text>
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

          <SurveyNumberInput
            label="AVERAGE PACE"
            value={paceKmh}
            onChangeText={setPaceKmh}
            unit="km/h"
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimaryContainer} />
            ) : (
              <Text style={styles.submitText}>CONTINUE</Text>
            )}
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerMargin,
    paddingVertical: Spacing.xxl,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: FontSize.headlineLgMobile,
    fontWeight: '800',
    color: Colors.primaryContainer,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.bodyLg,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  card: {
    gap: Spacing.md,
  },
  sectionLabel: {
    fontSize: FontSize.labelCaps,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryContainer,
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.full,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
});

export default OnboardingScreen;
