// ============================================================
// Chakrava — StatCard component (dashboard metric widget)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface Props {
  label: string;
  value: number | string;
  icon: string;        // emoji icon
  accent?: string;     // override card accent color
  onPress?: () => void;
}

export const StatCard: React.FC<Props> = ({
  label, value, icon, accent = Colors.primary, onPress,
}) => (
  <Pressable
    style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    onPress={onPress}
    android_ripple={{ color: Colors.border }}
  >
    <View style={[styles.iconBox, { backgroundColor: accent + '20' }]}>
      <Text style={styles.icon}>{icon}</Text>
    </View>
    <Text style={[styles.value, { color: accent }]}>{value}</Text>
    <Text style={styles.label} numberOfLines={2}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: Colors.surface,
    borderRadius:    Layout.radius.lg,
    padding:         Layout.spacing.md,
    alignItems:      'center',
    gap:             6,
    ...Layout.shadow.md,
  },
  pressed: {
    opacity: 0.85,
  },
  iconBox: {
    width:          44,
    height:         44,
    borderRadius:   22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 22,
  },
  value: {
    fontSize:   Layout.fontSize.xxl,
    fontWeight: Layout.fontWeight.black,
  },
  label: {
    fontSize:  Layout.fontSize.xs,
    color:     Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
