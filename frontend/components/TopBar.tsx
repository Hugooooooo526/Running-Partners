import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../theme';

interface TopBarProps {
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuPress, onNotificationsPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onMenuPress}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>☰</Text>
      </TouchableOpacity>

      <Text style={styles.title}>RUNNING PARTNERS</Text>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={onNotificationsPress}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>🔔</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: 64,
    backgroundColor: 'rgba(18, 19, 23, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.containerMargin,
    paddingTop: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
    color: Colors.onSurfaceVariant,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    color: Colors.primaryContainer,
  },
});

export default TopBar;
