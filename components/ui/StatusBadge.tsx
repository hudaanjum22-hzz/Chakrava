// ============================================================
// Chakrava — StatusBadge component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import type { BinStatus, OverflowRisk } from '../../types';

type BadgeVariant = BinStatus | OverflowRisk | 'active' | 'idle' | 'demo';

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; label: string }> = {
  normal:    { bg: Colors.successLight, text: Colors.success,  label: 'Normal'   },
  attention: { bg: Colors.warningLight, text: Colors.warning,  label: 'Attention'},
  critical:  { bg: Colors.dangerLight,  text: Colors.danger,   label: 'Critical' },
  high:      { bg: '#FEE8D3',           text: '#D35400',       label: 'High Risk'},
  medium:    { bg: Colors.warningLight, text: Colors.warning,  label: 'Medium'   },
  low:       { bg: Colors.successLight, text: Colors.success,  label: 'Low'      },
  active:    { bg: Colors.infoLight,    text: Colors.info,     label: 'Active'   },
  idle:      { bg: '#F0F0F0',           text: Colors.muted,    label: 'Idle'     },
  demo:      { bg: '#E8F4FD',           text: '#1A5276',       label: '● DEMO'   },
};

interface Props {
  variant: BadgeVariant;
  label?: string;
  small?: boolean;
}

export const StatusBadge: React.FC<Props> = ({ variant, label, small = false }) => {
  const style = VARIANT_STYLES[variant] ?? VARIANT_STYLES.idle;
  const displayLabel = label ?? style.label;

  return (
    <View style={[
      styles.badge,
      { backgroundColor: style.bg },
      small && styles.small,
    ]}>
      <Text style={[
        styles.text,
        { color: style.text },
        small && styles.smallText,
      ]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical:   3,
    borderRadius:      Layout.radius.full,
    alignSelf:         'flex-start',
  },
  text: {
    fontSize:   Layout.fontSize.xs,
    fontWeight: Layout.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical:   2,
  },
  smallText: {
    fontSize: 10,
  },
});
