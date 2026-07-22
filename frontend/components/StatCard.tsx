import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: string;
  wide?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, icon, wide }) => {
  return (
    <View style={[styles.card, wide && styles.wide]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {icon && <Text style={styles.icon}>{icon}</Text>}
      </View>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
  },
  wide: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryContainer,
    letterSpacing: 0.5,
  },
  icon: {
    fontSize: 18,
    color: Colors.primaryContainer,
    opacity: 0.4,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default StatCard;
