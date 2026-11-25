// ============================================================
// Chakrava — BinCard component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { FillLevelBar } from './FillLevelBar';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '../../utils/formatters';
import type { Bin } from '../../types';

interface Props {
  bin: Bin;
  onPress?: () => void;
  showOverflow?: boolean;
  overflowEta?: string;
}

export const BinCard: React.FC<Props> = ({ bin, onPress, showOverflow, overflowEta }) => {
  const leftBorderColor =
    bin.status === 'critical' ? Colors.danger :
    bin.status === 'attention' ? Colors.warning : Colors.success;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      android_ripple={{ color: Colors.border }}
    >
      <View style={[styles.leftBorder, { backgroundColor: leftBorderColor }]} />
      <View style={styles.body}>
        {/* Row 1: Bin code + badge */}
        <View style={styles.row}>
          <View style={styles.titleRow}>
            <Text style={styles.binCode}>{bin.bin_code}</Text>
            <StatusBadge variant={bin.status} small />
          </View>
        </View>

        {/* Row 2: Label and area */}
        <Text style={styles.label} numberOfLines={1}>{bin.label}</Text>
        <Text style={styles.area}>📍 {bin.area}</Text>

        {/* Fill level bar */}
        <View style={styles.fillRow}>
          <FillLevelBar fillPct={bin.fill_pct} height={8} />
        </View>

        {/* Row 3: Last collected + overflow ETA */}
        <View style={styles.footerRow}>
          <Text style={styles.meta}>
            🕐 {formatRelativeTime(bin.last_collected_at)}
          </Text>
          {showOverflow && overflowEta && (
            <Text style={[
              styles.eta,
              bin.status === 'critical' && { color: Colors.danger },
              bin.status === 'attention' && { color: Colors.warning },
            ]}>
              ⚠️ {overflowEta}
            </Text>
          )}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
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
  leftBorder: {
    width: 5,
  },
  body: {
    flex:    1,
    padding: Layout.spacing.md,
    gap:     4,
  },
  row: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  titleRow: {
    flex:          1,
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
    fontSize: Layout.fontSize.sm,
    color:    Colors.text,
    fontWeight: Layout.fontWeight.medium,
  },
  area: {
    fontSize: Layout.fontSize.xs,
    color:    Colors.textSecondary,
  },
  fillRow: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:       4,
  },
  meta: {
    fontSize: Layout.fontSize.xs,
    color:    Colors.muted,
  },
  eta: {
    fontSize:   Layout.fontSize.xs,
    fontWeight: Layout.fontWeight.semibold,
    color:      Colors.warning,
  },
  arrow: {
    paddingHorizontal: Layout.spacing.sm,
    alignSelf:         'center',
    fontSize:          22,
    color:             Colors.muted,
  },
});
