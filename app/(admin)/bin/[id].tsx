
import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';

import { Colors } from '../../../constants/Colors';
import { Layout } from '../../../constants/Layout';
import { FillLevelBar } from '../../../components/ui/FillLevelBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';

import {
  getBinById,
  updateBinFill,
} from '../../../services/demoService';

import { makeDemoReadings } from '../../../constants/DemoData';

import {
  predictOverflow,
  riskLabel,
  riskColor,
} from '../../../utils/overflowPredictor';

import {
  formatRelativeTime,
  formatDateTime,
} from '../../../utils/formatters';

import type { Bin, SensorReading } from '../../../types';
import { supabase, DEMO_MODE } from '../../../services/supabase';

export default function BinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const [bin, setBin] = useState<Bin | undefined>(() =>
    getBinById(id)
  );

  const [readings, setReadings] = useState<SensorReading[]>([]);

  useEffect(() => {
    if (bin) {
      navigation.setOptions({ title: bin.bin_code });

      setReadings(
        makeDemoReadings(bin.id, bin.fill_pct)
      );
    }
  }, [bin, navigation]);

  if (!bin) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          Bin not found: {id}
        </Text>
      </View>
    );
  }

  const pred = predictOverflow(bin);
  const rColor = riskColor[pred.risk];

  const handleResetFill = async () => {
    const collectedAt = new Date().toISOString();

    try {
      if (DEMO_MODE || !supabase) {
        updateBinFill(bin.id, 5);
        setBin({
          ...bin,
          fill_pct: 5,
          last_collected_at: collectedAt,
        });

        Alert.alert(
          'Collected',
          'Demo collection completed successfully.',
        );
        return;
      }

      const { error: recordError } = await supabase
        .from('collection_records')
        .insert({
          bin_id: bin.id,
          fill_before: bin.fill_pct,
          fill_after: 5,
          notes: 'Manually collected by admin',
        });

      if (recordError) {
        throw recordError;
      }

      const { error: binError } = await supabase
        .from('bins')
        .update({
          fill_pct: 5,
          last_collected_at: collectedAt,
        })
        .eq('id', bin.id);

      if (binError) {
        Alert.alert(
          'Collection record saved',
          'The collection was recorded, but the bin update failed. Please refresh the bin.',
        );
        return;
      }

      updateBinFill(bin.id, 5);
      setBin({
        ...bin,
        fill_pct: 5,
        last_collected_at: collectedAt,
      });

      Alert.alert(
        'Collected',
        'Collection saved successfully. Refresh the dashboard to see the updated count.',
      );
    } catch (error: any) {
      console.error('COLLECTION SAVE ERROR:', error);
      Alert.alert(
        'Collection failed',
        error?.message ?? 'Could not save the collection. Please try again.',
      );
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.binCode}>
            {bin.bin_code}
          </Text>

          <StatusBadge variant={bin.status} />
        </View>

        <Text style={styles.label}>
          {bin.label}
        </Text>

        <Text style={styles.area}>
          📍 {bin.area}
        </Text>

        <Text style={styles.coords}>
          🌐 {bin.lat.toFixed(4)}, {bin.lng.toFixed(4)}
        </Text>

        {bin.notes && (
          <Text style={styles.notes}>
            📝 {bin.notes}
          </Text>
        )}
      </View>

      {/* Fill level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Fill Level
        </Text>

        <View style={styles.gaugeRow}>
          <View style={styles.gaugePct}>
            <Text
              style={[
                styles.pctText,
                { color: rColor },
              ]}
            >
              {Math.round(bin.fill_pct)}%
            </Text>

            <Text style={styles.capacity}>
              {bin.capacity_litres}L capacity
            </Text>
          </View>

          <View style={styles.gaugeBar}>
            <FillLevelBar
              fillPct={bin.fill_pct}
              height={16}
              showLabel={false}
            />
          </View>
        </View>
      </View>

      {/* Overflow prediction */}
      <View
        style={[
          styles.section,
          { borderLeftColor: rColor },
        ]}
      >
        <Text style={styles.sectionTitle}>
          ⚡ Overflow Prediction
        </Text>

        <View style={styles.predGrid}>
          <View style={styles.predItem}>
            <Text style={styles.predLabel}>
              Risk Level
            </Text>

            <Text
              style={[
                styles.predValue,
                { color: rColor },
              ]}
            >
              {riskLabel[pred.risk]}
            </Text>
          </View>

          <View style={styles.predItem}>
            <Text style={styles.predLabel}>
              Time to Overflow
            </Text>

            <Text
              style={[
                styles.predValue,
                { color: rColor },
              ]}
            >
              {pred.display_eta}
            </Text>
          </View>

          <View style={styles.predItem}>
            <Text style={styles.predLabel}>
              Fill Rate
            </Text>

            <Text style={styles.predValue}>
              {bin.fill_rate_per_hour.toFixed(1)}% / hr
            </Text>
          </View>

          <View style={styles.predItem}>
            <Text style={styles.predLabel}>
              Last Collected
            </Text>

            <Text style={styles.predValue}>
              {formatRelativeTime(bin.last_collected_at)}
            </Text>
          </View>
        </View>

        <View style={styles.riskBar}>
          <View
            style={[
              styles.riskFill,
              {
                width: `${Math.min(
                  100,
                  bin.fill_pct
                )}%`,
                backgroundColor: rColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Sensor readings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          📈 Recent Readings (Demo)
        </Text>

        {readings.map((r, i) => (
          <View
            key={r.id}
            style={[
              styles.readingRow,
              i < readings.length - 1 &&
                styles.readingBorder,
            ]}
          >
            <Text style={styles.readingTime}>
              {formatDateTime(r.recorded_at)}
            </Text>

            <View style={styles.readingRight}>
              <Text style={styles.readingPct}>
                {Math.round(r.fill_pct)}%
              </Text>

              <StatusBadge
                variant="demo"
                small
              />
            </View>
          </View>
        ))}
      </View>

      {/* Admin action */}
      <View style={styles.actionsSection}>
        <Pressable
          style={[
            styles.actionBtn,
            { backgroundColor: Colors.success },
          ]}
          onPress={handleResetFill}
        >
          <Text style={styles.actionBtnText}>
            ✅ Mark as Manually Collected
          </Text>
        </Pressable>
      </View>

      <View style={{ height: Layout.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: Layout.spacing.md,
    gap: Layout.spacing.md,
  },

  error: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorText: {
    color: Colors.danger,
  },

  headerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    gap: 6,
    ...Layout.shadow.md,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  binCode: {
    fontSize: Layout.fontSize.xl,
    fontWeight: Layout.fontWeight.black,
    color: Colors.text,
  },

  label: {
    fontSize: Layout.fontSize.lg,
    fontWeight: Layout.fontWeight.semibold,
    color: Colors.text,
  },

  area: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },

  coords: {
    fontSize: Layout.fontSize.xs,
    color: Colors.muted,
  },

  notes: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.xl,
    padding: Layout.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
    gap: Layout.spacing.sm,
    ...Layout.shadow.sm,
  },

  sectionTitle: {
    fontSize: Layout.fontSize.md,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
  },

  gaugePct: {
    alignItems: 'center',
    minWidth: 72,
  },

  pctText: {
    fontSize: Layout.fontSize.hero,
    fontWeight: Layout.fontWeight.black,
  },

  capacity: {
    fontSize: Layout.fontSize.xs,
    color: Colors.muted,
  },

  gaugeBar: {
    flex: 1,
  },

  predGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.spacing.sm,
  },

  predItem: {
    width: '48%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.sm,
    gap: 2,
  },

  predLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.muted,
  },

  predValue: {
    fontSize: Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  riskBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Layout.radius.full,
    overflow: 'hidden',
  },

  riskFill: {
    height: 8,
    borderRadius: Layout.radius.full,
  },

  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },

  readingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  readingTime: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },

  readingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  readingPct: {
    fontSize: Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  actionsSection: {
    gap: Layout.spacing.sm,
  },

  actionBtn: {
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    ...Layout.shadow.sm,
  },

  actionBtnText: {
    fontSize: Layout.fontSize.md,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.textInverse,
  },
});

