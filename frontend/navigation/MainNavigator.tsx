import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { Colors } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primaryContainer,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'HOME',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              🗺️
            </Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'PROFILE',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
              👤
            </Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(30, 31, 35, 0.8)',
    borderTopColor: Colors.surfaceVariant,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: -4,
  },
  tabIconActive: {},
});

export default MainNavigator;
