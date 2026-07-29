import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';

interface SurveyNumberInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  placeholder?: string;
}

const SurveyNumberInput: React.FC<SurveyNumberInputProps> = ({
  label,
  value,
  onChangeText,
  unit,
  placeholder,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={Colors.onSurfaceVariant}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
        />
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.labelCaps,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: Spacing.touchTarget,
    backgroundColor: 'rgba(41, 42, 46, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(68, 73, 51, 0.3)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    fontSize: FontSize.bodyLg,
  },
  unit: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurfaceVariant,
    minWidth: 40,
  },
});

export default SurveyNumberInput;
