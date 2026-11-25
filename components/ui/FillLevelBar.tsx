// ============================================================
// Chakrava — FillLevelBar component (animated fill meter)
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface Props {
  fillPct: number;    // 0–100
  showLabel?: boolean;
  height?: number;
  animated?: boolean;
}

const getFillColor = (pct: number): string => {
  if (pct >= 85) return Colors.danger;
  if (pct >= 55) return Colors.warning;
  return Colors.primary;
};

export const FillLevelBar: React.FC<Props> = ({
  fillPct,
  showLabel = true,
  height = 10,
  animated = true,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  const clamped = Math.min(100, Math.max(0, fillPct));

  useEffect(() => {
    if (animated) {
      Animated.timing(anim, {
        toValue: clamped,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(clamped);
    }
  }, [clamped]);

  const widthInterpolated = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const color = getFillColor(clamped);

  return (
    <View style={styles.container}>
      <View style={[styles.track, { height }]}>
        <Animated.View
          style={[
            styles.fill,
            { width: widthInterpolated, backgroundColor: color, height },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color }]}>{Math.round(clamped)}%</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  track: {
    flex:            1,
    backgroundColor: Colors.border,
    borderRadius:    Layout.radius.full,
    overflow:        'hidden',
  },
  fill: {
    borderRadius: Layout.radius.full,
  },
  label: {
    fontSize:   Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.bold,
    minWidth:   36,
    textAlign:  'right',
  },
});
