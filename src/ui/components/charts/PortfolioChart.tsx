import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';
import { typography } from '../../theme';
import { formatCurrency } from '../../../lib/formatters';
import type { PortfolioHistoryPoint } from '../../../types';

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[];
  width: number;
  height: number;
  style?: ViewStyle;
}

export function PortfolioChart({ data, width, height, style }: PortfolioChartProps) {
  const { colors } = useTheme();
  const chartPadding = { top: 16, bottom: 32, left: 8, right: 8 };

  const chartWidth = width - chartPadding.left - chartPadding.right;
  const chartHeight = height - chartPadding.top - chartPadding.bottom;

  const { path, gradientPath, positive, labels } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', gradientPath: '', positive: true, labels: [] };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = chartWidth / (data.length - 1);

    const points = data.map((d, i) => ({
      x: chartPadding.left + i * stepX,
      y: chartPadding.top + chartHeight - ((d.value - min) / range) * chartHeight,
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const last = points[points.length - 1];
    const gPath = `${d} L ${last.x} ${chartPadding.top + chartHeight} L ${points[0].x} ${chartPadding.top + chartHeight} Z`;

    // Y-axis labels
    const yLabels = [min, min + range * 0.5, max].map((v) => ({
      value: formatCurrency(v, 'USD', true),
      y: chartPadding.top + chartHeight - ((v - min) / range) * chartHeight,
    }));

    return {
      path: d,
      gradientPath: gPath,
      positive: values[values.length - 1] >= values[0],
      labels: yLabels,
    };
  }, [data, chartWidth, chartHeight, chartPadding.left, chartPadding.top]);

  if (!path || data.length < 2) {
    return (
      <View style={[{ width, height, justifyContent: 'center', alignItems: 'center' }, style]}>
        <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
          Not enough data for chart
        </Text>
      </View>
    );
  }

  const lineColor = positive ? colors.chartPositive : colors.chartNegative;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.2} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0.01} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {labels.map((label, i) => (
          <Line
            key={i}
            x1={chartPadding.left}
            y1={label.y}
            x2={width - chartPadding.right}
            y2={label.y}
            stroke={colors.divider}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        <Path d={gradientPath} fill="url(#portfolioGradient)" />
        <Path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>

      {/* Y-axis labels */}
      {labels.map((label, i) => (
        <Text
          key={i}
          style={[
            styles.yLabel,
            { color: colors.textTertiary, top: label.y - 6, right: chartPadding.right + 4 },
          ]}
        >
          {label.value}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    ...typography.caption,
    fontSize: 10,
  },
});
