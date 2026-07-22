import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(44, 44, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: 16,
  },
});

export default GlassCard;
