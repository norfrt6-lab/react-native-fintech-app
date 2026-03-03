import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeContext';

interface SparklineChartProps {
  data: number[];
  width: number;
  height: number;
  style?: ViewStyle;
}

export function SparklineChart({ data, width, height, style }: SparklineChartProps) {
  const { colors } = useTheme();

  const { path, positive } = useMemo(() => {
    if (data.length < 2) return { path: '', positive: true };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const padding = 1;
    const chartHeight = height - padding * 2;

    const points = data.map((v, i) => ({
      x: i * stepX,
      y: padding + chartHeight - ((v - min) / range) * chartHeight,
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    return { path: d, positive: data[data.length - 1] >= data[0] };
  }, [data, width, height]);

  if (!path) return <View style={[{ width, height }, style]} />;

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Path
          d={path}
          fill="none"
          stroke={positive ? colors.chartPositive : colors.chartNegative}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
