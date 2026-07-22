import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../theme';

interface BottomNavProps {
  activeTab: 'Home' | 'Profile';
  onTabPress: (tab: 'Home' | 'Profile') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'Home' && styles.activeTab]}
        onPress={() => onTabPress('Home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'Home' && styles.activeTabIcon]}>
          🗺️
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'Home' && styles.activeTabLabel]}>
          HOME
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'Profile' && styles.activeTab]}
        onPress={() => onTabPress('Profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, activeTab === 'Profile' && styles.activeTabIcon]}>
          👤
        </Text>
        <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.activeTabLabel]}>
          PROFILE
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 64,
    backgroundColor: 'rgba(30, 31, 35, 0.8)',
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.full,
  },
  activeTab: {
    backgroundColor: Colors.primaryContainer,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  activeTabIcon: {},
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  activeTabLabel: {
    color: Colors.onPrimaryContainer,
  },
});

export default BottomNav;
