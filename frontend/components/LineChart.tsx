import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../theme';

export interface ChartPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  series: ChartPoint[];
  color?: string;
  height?: number;
}

const PAD_TOP = 20;
const PAD_BOTTOM = 22;
const PAD_SIDE = 8;

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const LineChart: React.FC<LineChartProps> = ({
  series,
  color = Colors.primaryContainer,
  height = 110,
}) => {
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  if (series.length < 2) {
    return (
      <View style={[styles.container, { height }]} onLayout={onLayout}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <SvgText
              x={width / 2}
              y={height / 2}
              fill={Colors.onSurfaceVariant}
              fontSize={11}
              textAnchor="middle"
              opacity={0.7}
            >
              {series.length === 1 ? 'One run logged' : 'Log runs to see your trend'}
            </SvgText>
          </Svg>
        )}
      </View>
    );
  }

  const values = series.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    const pad = min === 0 ? 1 : Math.max(min * 0.1, 1);
    min -= pad;
    max += pad;
  } else {
    const range = max - min;
    min -= range * 0.15;
    max += range * 0.15;
  }

  const innerHeight = height - PAD_TOP - PAD_BOTTOM;
  const innerWidth = Math.max(0, width - PAD_SIDE * 2);

  const points = series.map((p, i) => {
    const x =
      PAD_SIDE +
      (series.length === 1 ? innerWidth / 2 : (i / (series.length - 1)) * innerWidth);
    const y = PAD_TOP + (1 - (p.value - min) / (max - min)) * innerHeight;
    return { x, y, value: p.value };
  });

  const linePath = smoothPath(points);
  const areaPath = linePath
    ? `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + innerHeight} L ${points[0].x} ${
        PAD_TOP + innerHeight
      } Z`
    : '';

  const firstLabel = series[0].label;
  const lastLabel = series[series.length - 1].label;

  return (
    <View style={[styles.container, { height }]} onLayout={onLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Path d={areaPath} fill={color} fillOpacity={0.12} />
          <Path d={linePath} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />

          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={3} fill={Colors.surface} stroke={color} strokeWidth={2} />
          ))}

          <SvgText
            x={PAD_SIDE}
            y={PAD_TOP + innerHeight + 18}
            fill={Colors.onSurfaceVariant}
            fontSize={9}
            opacity={0.6}
          >
            {firstLabel}
          </SvgText>
          <SvgText
            x={width - PAD_SIDE}
            y={PAD_TOP + innerHeight + 18}
            fill={Colors.onSurfaceVariant}
            fontSize={9}
            opacity={0.6}
            textAnchor="end"
          >
            {lastLabel}
          </SvgText>
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});

export default LineChart;
