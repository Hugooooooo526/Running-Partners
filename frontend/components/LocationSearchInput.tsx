import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../theme';

interface RoutePoint {
  latitude: number;
  longitude: number;
}

interface GeocodeResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationSearchInputProps {
  label: string;
  placeholder: string;
  active: boolean;
  externalValue: string | null;
  onFocus: () => void;
  onPick: (point: RoutePoint, label: string) => void;
}

const SEARCH_DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  label,
  placeholder,
  active,
  externalValue,
  onFocus,
  onPick,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef('');

  useEffect(() => {
    if (externalValue !== null) setQuery(externalValue);
  }, [externalValue]);

  const handleChangeText = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.trim().length < MIN_QUERY_LENGTH) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      latestQueryRef.current = text;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=5`
        );
        const data = (await res.json()) as GeocodeResult[];
        if (latestQueryRef.current === text) setResults(data);
      } catch (e) {
        if (latestQueryRef.current === text) setResults([]);
      } finally {
        if (latestQueryRef.current === text) setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  const handleSelect = (result: GeocodeResult) => {
    setQuery(result.display_name);
    setResults([]);
    onPick({ latitude: parseFloat(result.lat), longitude: parseFloat(result.lon) }, result.display_name);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, active && styles.inputActive]}
        placeholder={placeholder}
        placeholderTextColor={Colors.onSurfaceVariant}
        value={query}
        onChangeText={handleChangeText}
        onFocus={onFocus}
      />
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.onSurfaceVariant} />
        </View>
      )}
      {results.length > 0 && (
        <View style={styles.resultsBox}>
          {results.map((result, idx) => (
            <TouchableOpacity
              key={`${result.lat}-${result.lon}-${idx}`}
              style={styles.resultRow}
              activeOpacity={0.7}
              onPress={() => handleSelect(result)}
            >
              <Text style={styles.resultText} numberOfLines={2}>
                {result.display_name}
              </Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.attribution}>Search by OpenStreetMap</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: Spacing.touchTarget,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainerHigh,
    paddingHorizontal: Spacing.md,
    color: Colors.onSurface,
    fontSize: FontSize.bodyMd,
  },
  inputActive: {
    borderColor: Colors.primaryContainer,
  },
  loadingRow: {
    position: 'absolute',
    right: Spacing.md,
    top: 32,
  },
  resultsBox: {
    marginTop: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceVariant,
    backgroundColor: Colors.surfaceContainer,
    overflow: 'hidden',
  },
  resultRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceVariant,
  },
  resultText: {
    fontSize: FontSize.bodyMd,
    color: Colors.onSurface,
  },
  attribution: {
    fontSize: 9,
    color: Colors.onSurfaceVariant,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
});

export default LocationSearchInput;
