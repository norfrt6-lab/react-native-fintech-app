import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface DataPoint {
  timestamp: number;
  price: number;
}

interface LineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  positive?: boolean;
  showGradient?: boolean;
  showDots?: boolean;
  strokeWidth?: number;
  style?: ViewStyle;
}

function createPath(
  data: DataPoint[],
  width: number,
  height: number,
  padding = 0,
): { path: string; gradientPath: string; minPrice: number; maxPrice: number } {
  if (data.length < 2) {
    return { path: '', gradientPath: '', minPrice: 0, maxPrice: 0 };
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const stepX = chartWidth / (data.length - 1);

  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + chartHeight - ((d.price - minPrice) / priceRange) * chartHeight,
  }));

  // Smooth bezier curve
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  // Gradient fill path
  const lastPoint = points[points.length - 1];
  const gradientPath = `${path} L ${lastPoint.x} ${height} L ${points[0].x} ${height} Z`;

  return { path, gradientPath, minPrice, maxPrice };
}

export function LineChart({
  data,
  width,
  height,
  positive = true,
  showGradient = true,
  showDots = false,
  strokeWidth = 2,
  style,
}: LineChartProps) {
  const { colors } = useTheme();
  const padding = 4;

  const { path, gradientPath } = useMemo(
    () => createPath(data, width, height, padding),
    [data, width, height],
  );

  if (!path || data.length < 2) {
    return <View style={[{ width, height }, style]} />;
  }

  const lineColor = positive ? colors.chartPositive : colors.chartNegative;
  const gradientId = `gradient_${positive ? 'pos' : 'neg'}`;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.25} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {showGradient && (
          <Path d={gradientPath} fill={`url(#${gradientId})`} />
        )}

        <Path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
