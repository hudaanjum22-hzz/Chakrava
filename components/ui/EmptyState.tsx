// ============================================================
// Chakrava — EmptyState component
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<Props> = ({ icon = '📭', title, subtitle }) => (
  <View style={styles.container}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        Layout.spacing.xxl,
    gap:            Layout.spacing.sm,
  },
  icon:  { fontSize: 48, textAlign: 'center' },
  title: {
    fontSize:   Layout.fontSize.lg,
    fontWeight: Layout.fontWeight.semibold,
    color:      Colors.text,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:  Layout.fontSize.sm,
    color:     Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
