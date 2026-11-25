// ============================================================
// Chakrava — TaskCard component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { StatusBadge } from './StatusBadge';
import { FillLevelBar } from './FillLevelBar';
import { formatHours } from '../../utils/formatters';
import type { CollectionTask, Bin } from '../../types';

interface Props {
  task: CollectionTask;
  bin?: Bin;
  onPress?: () => void;
  showOrder?: boolean;
  order?: number;
  distanceKm?: number;
}

export const TaskCard: React.FC<Props> = ({
  task, bin, onPress, showOrder, order, distanceKm,
}) => {
  const riskColor =
    task.overflow_risk === 'critical' ? Colors.danger :
    task.overflow_risk === 'high'     ? '#D35400'      :
    task.overflow_risk === 'medium'   ? Colors.warning : Colors.success;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      android_ripple={{ color: Colors.border }}
    >
      {showOrder && (
        <View style={[styles.orderBadge, { backgroundColor: riskColor }]}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.binCode}>{bin?.bin_code ?? task.bin_id}</Text>
          <StatusBadge variant={task.overflow_risk} small />
        </View>

        {bin && (
          <>
            <Text style={styles.label} numberOfLines={1}>{bin.label}</Text>
            <Text style={styles.area}>📍 {bin.area}</Text>
            <View style={styles.fillRow}>
              <FillLevelBar fillPct={bin.fill_pct} height={6} />
            </View>
          </>
        )}

        <View style={styles.footerRow}>
          {task.eta_hours != null && (
            <Text style={[styles.eta, { color: riskColor }]}>
              ⏱ Overflow in ~{formatHours(task.eta_hours)}
            </Text>
          )}
          {distanceKm != null && (
            <Text style={styles.distance}>
              📏 {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    backgroundColor: Colors.surface,
    borderRadius:    Layout.radius.lg,
    marginHorizontal: Layout.spacing.md,
    marginBottom:    Layout.spacing.sm,
    overflow:        'hidden',
    ...Layout.shadow.sm,
  },
  pressed: { opacity: 0.85 },
  orderBadge: {
    width:          40,
    alignItems:     'center',
    justifyContent: 'center',
  },
  orderText: {
    fontSize:   Layout.fontSize.md,
    fontWeight: Layout.fontWeight.black,
    color:      Colors.textInverse,
  },
  body: {
    flex:    1,
    padding: Layout.spacing.md,
    gap:     3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  binCode: {
    fontSize:   Layout.fontSize.md,
    fontWeight: Layout.fontWeight.bold,
    color:      Colors.text,
  },
  label: {
    fontSize:   Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.medium,
    color:      Colors.text,
  },
  area: {
    fontSize: Layout.fontSize.xs,
    color:    Colors.textSecondary,
  },
  fillRow: { marginTop: 4 },
  footerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:       4,
  },
  eta: {
    fontSize:   Layout.fontSize.xs,
    fontWeight: Layout.fontWeight.semibold,
  },
  distance: {
    fontSize: Layout.fontSize.xs,
    color:    Colors.muted,
  },
});
