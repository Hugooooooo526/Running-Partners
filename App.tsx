import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MainNavigator from './frontend/navigation/MainNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
