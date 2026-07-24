import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './frontend/app/AuthContext';
import { useAuth } from './frontend/hooks/useAuth';
import MainNavigator from './frontend/navigation/MainNavigator';
import AuthScreen from './frontend/screens/AuthScreen';
import { Colors, Spacing, BorderRadius, FontSize } from './frontend/theme';

const RootContent: React.FC = () => {
  const { session, profile, profileError, loading, signOut } = useAuth();

  if (loading) {
    return <View style={styles.blank} />;
  }

  if (session && !profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {profileError ?? 'Something went wrong loading your profile.'}
        </Text>
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={signOut}>
          <Text style={styles.logoutButtonText}>LOG OUT</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return session ? <MainNavigator /> : <AuthScreen />;
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootContent />
          <StatusBar style="light" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  blank: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.containerMargin,
  },
  errorText: {
    color: Colors.onSurface,
    fontSize: FontSize.bodyMd,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: Spacing.touchTarget,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryContainer,
  },
  logoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onPrimaryContainer,
    letterSpacing: 0.5,
  },
});
