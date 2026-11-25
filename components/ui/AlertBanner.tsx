// ============================================================
// Chakrava — AlertBanner component (overflow alert row)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import type { OverflowRisk } from '../../types';

interface Props {
  binCode: string;
  binLabel: string;
  area: string;
  risk: OverflowRisk;
  etaDisplay: string;
  onPress?: () => void;
}

const RISK_COLOR: Record<OverflowRisk, string> = {
  critical: Colors.danger,
  high:     '#D35400',
  medium:   Colors.warning,
  low:      Colors.success,
};

const RISK_ICON: Record<OverflowRisk, string> = {
  critical: '🚨',
  high:     '⚠️',
  medium:   '🔔',
  low:      '✅',
};

export const AlertBanner: React.FC<Props> = ({
  binCode, binLabel, area, risk, etaDisplay, onPress,
}) => {
  const color = RISK_COLOR[risk];
  return (
    <Pressable
      style={[styles.banner, { borderLeftColor: color, borderLeftWidth: 4 }]}
      onPress={onPress}
      android_ripple={{ color: Colors.border }}
    >
      <Text style={styles.icon}>{RISK_ICON[risk]}</Text>
      <View style={styles.info}>
        <View style={styles.row}>
          <Text style={styles.binCode}>{binCode}</Text>
          <Text style={[styles.riskLabel, { color }]}>{risk.toUpperCase()}</Text>
        </View>
        <Text style={styles.label} numberOfLines={1}>{binLabel} · {area}</Text>
        <Text style={[styles.eta, { color }]}>Overflow in {etaDisplay}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.surface,
    borderRadius:    Layout.radius.md,
    marginHorizontal: Layout.spacing.md,
    marginBottom:    Layout.spacing.sm,
    padding:         Layout.spacing.md,
    gap:             Layout.spacing.sm,
    ...Layout.shadow.sm,
  },
  icon:  { fontSize: 22 },
  info:  { flex: 1, gap: 2 },
  row:   { flexDirection: 'row', justifyContent: 'space-between' },
  binCode: {
    fontSize:   Layout.fontSize.md,
    fontWeight: Layout.fontWeight.bold,
    color:      Colors.text,
  },
  riskLabel: {
    fontSize:   Layout.fontSize.xs,
    fontWeight: Layout.fontWeight.bold,
  },
  label: {
    fontSize: Layout.fontSize.xs,
    color:    Colors.textSecondary,
  },
  eta: {
    fontSize:   Layout.fontSize.xs,
    fontWeight: Layout.fontWeight.semibold,
  },
  arrow: {
    fontSize: 20,
    color:    Colors.muted,
  },
});
