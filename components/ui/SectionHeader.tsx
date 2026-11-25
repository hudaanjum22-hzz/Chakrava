// ============================================================
// Chakrava — SectionHeader component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<Props> = ({ title, action, onAction }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {action && (
      <Pressable onPress={onAction}>
        <Text style={styles.action}>{action}</Text>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical:   Layout.spacing.sm,
  },
  title: {
    fontSize:   Layout.fontSize.lg,
    fontWeight: Layout.fontWeight.bold,
    color:      Colors.text,
  },
  action: {
    fontSize:   Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.semibold,
    color:      Colors.primary,
  },
});
