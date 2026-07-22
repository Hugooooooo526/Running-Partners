import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface RunnerPinProps {
  username: string;
  avatar?: string;
  selected?: boolean;
}

const RunnerPin: React.FC<RunnerPinProps> = ({ username, selected }) => {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.avatar, selected && styles.avatarSelected]}>
        <Text style={styles.avatarText}>{username[0]}</Text>
      </View>
      <View style={styles.label}>
        <Text style={styles.labelText}>{username.toUpperCase()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarSelected: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceContainerHighest,
    shadowColor: Colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  label: {
    marginTop: 4,
    backgroundColor: Colors.surfaceContainer,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
});

export default RunnerPin;
