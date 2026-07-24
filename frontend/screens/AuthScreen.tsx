import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';
import GlassCard from '../components/GlassCard';
import { useAuth } from '../hooks/useAuth';

type Mode = 'signin' | 'signup';

const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setNotice(null);
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    if (!trimmedEmail || !password || (mode === 'signup' && !trimmedUsername)) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { session } = await signUp(trimmedEmail, password, trimmedUsername);
        if (!session) {
          setNotice(
            'Account created, but email confirmation is still required for this project. Turn off "Confirm email" in Supabase → Authentication → Providers → Email to sign in immediately.'
          );
        }
      } else {
        await signIn(trimmedEmail, password);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      if (/rate limit/i.test(message)) {
        setError(
          'Too many signup emails sent recently. Turn off "Confirm email" in Supabase → Authentication → Providers → Email to stop this, or wait a while and try again.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError(null);
    setNotice(null);
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.title}>SMART MATCH</Text>
        <Text style={styles.subtitle}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </Text>

        <GlassCard style={styles.card}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.onSurfaceVariant}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.onSurfaceVariant}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.onSurfaceVariant}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {notice && <Text style={styles.notice}>{notice}</Text>}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.onPrimaryContainer} />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'signin' ? 'LOG IN' : 'SIGN UP'}
              </Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        <TouchableOpacity onPress={switchMode} activeOpacity={0.7} style={styles.switchRow}>
          <Text style={styles.switchText}>
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <Text style={styles.switchLink}>{mode === 'signin' ? 'Sign Up' : 'Log In'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerMargin,
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
  input: {
    height: Spacing.touchTarget,
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    fontSize: FontSize.bodyLg,
  },
  error: {
    color: Colors.error,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
  },
  notice: {
    color: Colors.onSurfaceVariant,
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
  switchRow: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  switchText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
  },
  switchLink: {
    color: Colors.primaryContainer,
    fontWeight: '700',
  },
});

export default AuthScreen;
