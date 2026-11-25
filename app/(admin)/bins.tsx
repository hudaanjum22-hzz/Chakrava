// ============================================================
// Chakrava — Bin Monitoring Screen (Admin)
// ============================================================
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { BinCard } from '../../components/ui/BinCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { getBins } from '../../services/demoService';
import { predictOverflow } from '../../utils/overflowPredictor';
import type { Bin, BinStatus } from '../../types';

type FilterTab = 'all' | BinStatus;

const TABS: { key: FilterTab; label: string; emoji: string }[] = [
  { key: 'all',       label: 'All',       emoji: '📋' },
  { key: 'critical',  label: 'Critical',  emoji: '🔴' },
  { key: 'attention', label: 'Attention', emoji: '🟡' },
  { key: 'normal',    label: 'Normal',    emoji: '🟢' },
];

export default function BinsScreen() {
  const router      = useRouter();
  const [filter, setFilter]       = useState<FilterTab>('all');
  const [bins, setBins]           = useState<Bin[]>(getBins);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => { setBins(getBins()); setRefreshing(false); }, 500);
  }, []);

  const filtered = filter === 'all' ? bins : bins.filter(b => b.status === filter);
  const sorted   = [...filtered].sort((a, b) => b.fill_pct - a.fill_pct);

  return (
    <View style={styles.screen}>
      {/* Filter tabs */}
      <View style={styles.tabBar}>
        {TABS.map(t => (
          <Pressable
            key={t.key}
            style={[styles.tab, filter === t.key && styles.tabActive]}
            onPress={() => setFilter(t.key)}
          >
            <Text style={styles.tabEmoji}>{t.emoji}</Text>
            <Text style={[styles.tabLabel, filter === t.key && styles.tabLabelActive]}>
              {t.label}
              {t.key !== 'all' && ` (${bins.filter(b => b.status === t.key).length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={b => b.id}
        renderItem={({ item }) => {
          const pred = predictOverflow(item);
          return (
            <BinCard
              bin={item}
              showOverflow
              overflowEta={pred.display_eta}
              onPress={() => router.push(`/(admin)/bin/${item.id}`)}
            />
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
        ListEmptyComponent={<EmptyState icon="🗑️" title="No bins in this category" />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.count}>{sorted.length} bin{sorted.length !== 1 ? 's' : ''} · sorted by fill level</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection:   'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Layout.spacing.sm,
  },
  tab: {
    flex:           1,
    paddingVertical: Layout.spacing.sm,
    alignItems:     'center',
    gap:            2,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabEmoji: { fontSize: 16 },
  tabLabel: {
    fontSize:  10,
    color:     Colors.muted,
    textAlign: 'center',
  },
  tabLabelActive: {
    color:      Colors.primary,
    fontWeight: '700',
  },
  list:  { paddingTop: Layout.spacing.sm, paddingBottom: Layout.spacing.xl },
  count: {
    fontSize:          Layout.fontSize.xs,
    color:             Colors.muted,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical:   Layout.spacing.sm,
  },
});
