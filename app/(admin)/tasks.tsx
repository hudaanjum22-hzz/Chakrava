
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';

import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import {
  getTasksWithBins,
  getVehicles,
} from '../../services/demoService';

export default function TasksScreen() {
  const router = useRouter();

  const [screen, setScreen] = useState<'pending' | 'routes'>('pending');
  const [routeGenerated, setRouteGenerated] = useState(false);

  const tasks = getTasksWithBins();
  const vehicles = getVehicles();

  const pendingTasks = tasks.filter(
    task => task.status === 'pending',
  );

  const activeTasks = tasks.filter(
    task => task.status === 'in_progress',
  );

  const routeTasks = useMemo(
    () =>
      pendingTasks
        .filter(task => task.bin)
        .sort(
          (a, b) =>
            (a.eta_hours ?? 999) -
            (b.eta_hours ?? 999),
        ),
    [pendingTasks],
  );

  const getRiskColor = (risk: string) => {
    if (risk === 'critical') return Colors.danger;
    if (risk === 'high') return Colors.warning;
    return Colors.success;
  };

  const getVehicleName = (vehicleId?: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.vehicle_code ?? 'Unassigned';
  };

  const handleGenerateRoute = () => {
    if (routeTasks.length === 0) {
      Alert.alert(
        'No pending collections',
        'There are no pending bins to include in a route.',
      );
      return;
    }

    setRouteGenerated(true);

    Alert.alert(
      'Route Planned',
      `${routeTasks.length} pending bins added to the suggested collection route.`,
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Collection Tasks</Text>
        <Text style={styles.subtitle}>
          Vattiyoorkavu Grama Panchayat
        </Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            screen === 'pending' && styles.activeTab,
          ]}
          onPress={() => setScreen('pending')}
        >
          <Text
            style={[
              styles.tabText,
              screen === 'pending' && styles.activeTabText,
            ]}
          >
            Pending ({pendingTasks.length})
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            screen === 'routes' && styles.activeTab,
          ]}
          onPress={() => setScreen('routes')}
        >
          <Text
            style={[
              styles.tabText,
              screen === 'routes' && styles.activeTabText,
            ]}
          >
            Plan Routes
          </Text>
        </Pressable>
      </View>

      {screen === 'pending' ? (
        <>
          <Text style={styles.sectionTitle}>
            Pending Collections
          </Text>

          {activeTasks.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                🚛 Currently In Progress
              </Text>
              <Text style={styles.infoText}>
                {activeTasks.length} collection(s) are
                currently being handled by drivers.
              </Text>
            </View>
          )}

          {pendingTasks.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                ✅ No pending collections
              </Text>
            </View>
          ) : (
            pendingTasks.map(task => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.binCode}>
                    {task.bin?.bin_code ?? task.bin_id}
                  </Text>

                  <Text
                    style={[
                      styles.risk,
                      { color: getRiskColor(task.overflow_risk) },
                    ]}
                  >
                    {task.overflow_risk.toUpperCase()} RISK
                  </Text>
                </View>

                <Text style={styles.binName}>
                  {task.bin?.label ?? 'Bin details unavailable'}
                </Text>

                <Text style={styles.location}>
                  📍 {task.bin?.area ?? 'Unknown area'}
                </Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.detail}>
                    Fill: {task.bin?.fill_pct ?? '--'}%
                  </Text>

                  <Text style={styles.detail}>
                    Priority: {task.priority}
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detail}>
                    Vehicle: {getVehicleName(task.vehicle_id)}
                  </Text>

                  <Text style={styles.detail}>
                    ETA: {task.eta_hours ?? '--'} hrs
                  </Text>
                </View>
              </View>
            ))
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() => setScreen('routes')}
          >
            <Text style={styles.primaryButtonText}>
              🗺️ Plan Collection Routes
            </Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.sectionTitle}>
            Smart Route Planning
          </Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              📋 Route Summary
            </Text>

            <Text style={styles.infoText}>
              Pending bins: {routeTasks.length}
            </Text>

            <Text style={styles.infoText}>
              Available vehicles: {vehicles.length}
            </Text>

            <Text style={styles.infoText}>
              Suggested order: Highest overflow urgency first
            </Text>
          </View>

          <Pressable
            style={styles.primaryButton}
            onPress={handleGenerateRoute}
          >
            <Text style={styles.primaryButtonText}>
              ⚡ Generate Suggested Route
            </Text>
          </Pressable>

          {routeGenerated && (
            <>
              <Text style={styles.sectionTitle}>
                Suggested Collection Order
              </Text>

              {routeTasks.map((task, index) => (
                <View key={task.id} style={styles.routeCard}>
                  <View style={styles.routeNumber}>
                    <Text style={styles.routeNumberText}>
                      {index + 1}
                    </Text>
                  </View>

                  <View style={styles.routeInfo}>
                    <Text style={styles.binCode}>
                      {task.bin?.bin_code ?? task.bin_id}
                    </Text>

                    <Text style={styles.binName}>
                      {task.bin?.label ?? 'Collection Bin'}
                    </Text>

                    <Text style={styles.location}>
                      {task.bin?.area ?? 'Unknown area'}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.risk,
                      { color: getRiskColor(task.overflow_risk) },
                    ]}
                  >
                    {task.overflow_risk.toUpperCase()}
                  </Text>
                </View>
              ))}

              <Text style={styles.routeNote}>
                Demo route order is based on predicted overflow
                time. Live GPS routing and road-distance
                optimization can be connected later.
              </Text>
            </>
          )}
        </>
      )}

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
  },
  header: {
    marginBottom: Layout.spacing.md,
  },
  back: {
    color: Colors.primary,
    fontSize: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: Layout.fontSize.xl,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: 4,
    marginBottom: Layout.spacing.md,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: Layout.radius.md,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.textInverse,
  },
  sectionTitle: {
    fontSize: Layout.fontSize.lg,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
    marginBottom: Layout.spacing.sm,
    marginTop: Layout.spacing.sm,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    ...Layout.shadow.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  binCode: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  risk: {
    fontSize: 11,
    fontWeight: '700',
  },
  binName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
  },
  location: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 5,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.success,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    alignItems: 'center',
    marginTop: Layout.spacing.md,
  },
  primaryButtonText: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.lg,
    marginBottom: Layout.spacing.sm,
    gap: 12,
  },
  routeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeNumberText: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  routeInfo: {
    flex: 1,
  },
  routeNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Layout.spacing.md,
    lineHeight: 18,
  },
});
