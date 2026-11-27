
import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Pressable,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { StatCard } from '../../components/ui/StatCard';
import { AlertBanner } from '../../components/ui/AlertBanner';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import {
  getDashboardStats,
  getBins,
  simulateSensorUpdate,
} from '../../services/demoService';
import { supabase, DEMO_MODE } from '../../services/supabase';
import type { Bin, DashboardStats } from '../../types';
import { predictAllBins } from '../../utils/overflowPredictor';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { session } = useAuth();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>(getDashboardStats);
  const [bins, setBins] = useState<Bin[]>(getBins);

  const [alerts, setAlerts] = useState(() =>
    predictAllBins(getBins()).filter(
      p => p.risk === 'critical' || p.risk === 'high'
    )
  );

  const updateDashboard = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setRefreshing(true);
      }

      try {
        // Demo mode: use local demo data
        if (DEMO_MODE || !supabase) {
          const freshBins = getBins();

          setBins(freshBins);
          setStats(getDashboardStats());

          setAlerts(
            predictAllBins(freshBins).filter(
              p => p.risk === 'critical' || p.risk === 'high'
            )
          );

          return;
        }

        // Check Supabase session
        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log('SUPABASE SESSION CHECK:', {
          hasSession: !!sessionData.session,
          hasUser: !!sessionData.session?.user,
          sessionError: sessionError?.message,
        });

        // Load bins
        const {
          data: binData,
          error: binError,
        } = await supabase
          .from('bins')
          .select('*')
          .order('bin_code');

        if (binError) {
          console.error('BINS QUERY ERROR:', binError);
          throw binError;
        }

        const freshBins = (binData ?? []) as Bin[];

        // Load vehicles
        const {
          data: vehicleData,
          error: vehicleError,
        } = await supabase
          .from('vehicles')
          .select('*');

        if (vehicleError) {
          console.error('VEHICLES QUERY ERROR:', vehicleError);
          throw vehicleError;
        }

        // Load collection tasks
        const {
          data: taskData,
          error: taskError,
        } = await supabase
          .from('collection_tasks')
          .select('*');

        if (taskError) {
          console.error('COLLECTION TASKS QUERY ERROR:', taskError);
          throw taskError;
        }

        // Load today's completed collections
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const {
          data: recordData,
          error: recordError,
        } = await supabase
          .from('collection_records')
          .select('*')
          .gte('collected_at', today.toISOString());

        if (recordError) {
          console.error('COLLECTION RECORDS QUERY ERROR:', recordError);
          throw recordError;
        }

        const vehicles = vehicleData ?? [];
        const tasks = taskData ?? [];
        const records = recordData ?? [];

        const freshStats: DashboardStats = {
          total_bins: freshBins.length,

          critical_bins: freshBins.filter(
            bin => bin.status === 'critical'
          ).length,

          pending_collections: tasks.filter(
            task =>
              task.status === 'pending' ||
              task.status === 'in_progress'
          ).length,

          active_vehicles: vehicles.filter(
            vehicle =>
              vehicle.is_on_duty === true &&
              vehicle.status !== 'off_duty'
          ).length,

          completed_today: records.length,
        };

        setBins(freshBins);
        setStats(freshStats);

        setAlerts(
          predictAllBins(freshBins).filter(
            p => p.risk === 'critical' || p.risk === 'high'
          )
        );
      } catch (error: any) {
        console.error('FULL DASHBOARD ERROR:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        });

        Alert.alert(
          'Unable to load dashboard',
          error?.message ||
            'Please check your internet connection and Supabase permissions.'
        );
      } finally {
        if (showLoading) {
          setRefreshing(false);
        }
      }
    },
    []
  );

  // Load dashboard when screen opens
  useEffect(() => {
    updateDashboard();
  }, [updateDashboard]);

  // Refresh button
  const refresh = useCallback(() => {
    updateDashboard(true);
  }, [updateDashboard]);

  // Demo sensor simulation only
  const handleSimulate = () => {
    if (!DEMO_MODE) {
      Alert.alert(
        'Live Sensor Data',
        'Real sensor readings require a connected sensor device. Pull down to refresh the latest database data.'
      );
      return;
    }

    const updated = simulateSensorUpdate();

    setBins(updated);
    setStats(getDashboardStats());

    setAlerts(
      predictAllBins(updated).filter(
        p => p.risk === 'critical' || p.risk === 'high'
      )
    );

    Alert.alert(
      'Sensor Update Simulated',
      `${updated.length} demo bins updated. ${
        updated.filter(b => b.status === 'critical').length
      } bins are critical.`
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Header greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetName}>
            Hello, {session?.profile.full_name?.split(' ')[0]} 👋
          </Text>

          <Text style={styles.greetSub}>
            Vattiyoorkavu Grama Panchayat
          </Text>
        </View>

        {DEMO_MODE && <StatusBadge variant="demo" />}
      </View>

      {/* Stats grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            label="Total Bins"
            value={stats.total_bins}
            icon="🗑️"
            onPress={() => router.push('/(admin)/bins')}
          />

          <StatCard
            label="Critical Bins"
            value={stats.critical_bins}
            icon="🚨"
            accent={Colors.danger}
            onPress={() => router.push('/(admin)/bins')}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Pending"
            value={stats.pending_collections}
            icon="⏳"
            accent={Colors.warning}
            onPress={() => router.push('/(admin)/tasks')}
          />

          <StatCard
            label="Active Trucks"
            value={stats.active_vehicles}
            icon="🚛"
            accent={Colors.info}
            onPress={() => router.push('/(admin)/map')}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="Collected Today"
            value={stats.completed_today}
            icon="✅"
            accent={Colors.success}
          />

          <StatCard
            label={DEMO_MODE ? 'Simulate Sensor' : 'Refresh Data'}
            value={DEMO_MODE ? '▶ Run' : '↻ Refresh'}
            icon="📡"
            accent={Colors.info}
            onPress={handleSimulate}
          />
        </View>
      </View>

      {/* Overflow alerts */}
      <SectionHeader
        title={`🚨 Overflow Alerts (${alerts.length})`}
        action="View All Bins"
        onAction={() => router.push('/(admin)/bins')}
      />

      {alerts.length === 0 ? (
        <View style={styles.noAlerts}>
          <Text style={styles.noAlertsText}>
            ✅ No critical overflow alerts right now
          </Text>
        </View>
      ) : (
        alerts.slice(0, 5).map(a => {
          const bin = bins.find(b => b.id === a.bin_id);

          if (!bin) {
            return null;
          }

          return (
            <AlertBanner
              key={a.bin_id}
              binCode={bin.bin_code}
              binLabel={bin.label}
              area={bin.area}
              risk={a.risk}
              etaDisplay={a.display_eta}
              onPress={() =>
                router.push(`/(admin)/bin/${bin.id}`)
              }
            />
          );
        })
      )}

      {/* Fill Level Summary */}
      <SectionHeader title="📊 Fill Level Summary" />

      <View style={styles.summaryRow}>
        {(['normal', 'attention', 'critical'] as const).map(status => {
          const count = bins.filter(
            b => b.status === status
          ).length;

          const icon =
            status === 'critical'
              ? '🔴'
              : status === 'attention'
              ? '🟡'
              : '🟢';

          return (
            <View key={status} style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>{icon}</Text>

              <Text style={styles.summaryCount}>{count}</Text>

              <Text style={styles.summaryLabel}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Quick Actions */}
      <SectionHeader title="⚡ Quick Actions" />

      <View style={styles.actionsRow}>
        {[
          {
            icon: '🗺️',
            label: 'Track Vehicles',
            path: '/(admin)/map',
          },
          {
            icon: '📍',
            label: 'GPS Tracking',
            path: '/gps',
          },
          {
            icon: '📋',
            label: 'Plan Routes',
            path: '/(admin)/tasks',
          },
          {
            icon: '🗑️',
            label: 'All Bins',
            path: '/(admin)/bins',
          },
        ].map(action => (
          <Pressable
            key={action.path}
            style={({ pressed }) => [
              styles.actionBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => router.push(action.path as any)}
          >
            <Text style={styles.actionIcon}>{action.icon}</Text>

            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
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
    paddingTop: Layout.spacing.md,
  },

  greeting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
  },

  greetName: {
    fontSize: Layout.fontSize.xl,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  greetSub: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },

  statsGrid: {
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },

  noAlerts: {
    marginHorizontal: Layout.spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: Layout.radius.md,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },

  noAlertsText: {
    color: Colors.success,
    fontSize: Layout.fontSize.sm,
    textAlign: 'center',
  },

  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Layout.shadow.sm,
  },

  summaryIcon: {
    fontSize: 22,
  },

  summaryCount: {
    fontSize: Layout.fontSize.xl,
    fontWeight: Layout.fontWeight.black,
    color: Colors.text,
  },

  summaryLabel: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },

  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: Layout.spacing.md,
    gap: Layout.spacing.sm,
    marginBottom: Layout.spacing.sm,
  },

  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    alignItems: 'center',
    gap: 4,
    ...Layout.shadow.sm,
  },

  actionIcon: {
    fontSize: 24,
  },

  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textInverse,
    textAlign: 'center',
  },
});
