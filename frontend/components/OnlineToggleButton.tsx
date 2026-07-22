import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../theme';

interface OnlineToggleButtonProps {
  isOnline: boolean;
  onToggle: () => void;
  style?: ViewStyle;
}

const OnlineToggleButton: React.FC<OnlineToggleButtonProps> = ({ isOnline, onToggle, style }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isOnline ? styles.online : styles.offline, style]}
      onPress={onToggle}
      activeOpacity={0.8}
    >
      {!isOnline && <View style={styles.dot} />}
      {isOnline && <View style={styles.pulseDot} />}
      <Text style={[styles.text, isOnline ? styles.onlineText : styles.offlineText]}>
        {isOnline ? 'FINDING PARTNERS' : 'GO ONLINE'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  online: {
    backgroundColor: Colors.primaryContainer,
  },
  offline: {
    backgroundColor: 'rgba(30, 31, 35, 0.8)',
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.onSurfaceVariant,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#121317',
    shadowColor: '#121317',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineText: {
    color: Colors.onPrimaryContainer,
  },
  offlineText: {
    color: Colors.onSurface,
  },
});

export default OnlineToggleButton;
