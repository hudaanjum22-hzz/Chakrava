// ============================================================
// Chakrava — Vehicle Tracking Map Screen (Admin)
// ============================================================

 // ============================================================
 // Chakrava — Vehicle Tracking Map Screen (Admin)
 // ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getVehicles, driftVehicles } from '../../services/demoService';
import { formatRelativeTime } from '../../utils/formatters';
import type { Vehicle, VehicleStatus } from '../../types';
import { DEMO_MODE } from '../../services/supabase';

// Try to import react-native-maps for native platforms
let MapView: any = null;
let Marker: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
  } catch {}
}

const STATUS_COLOR: Record<VehicleStatus, string> = {
  on_route: Colors.primary,
  collecting: Colors.warning,
  idle: Colors.muted,
  off_duty: Colors.border,
};

const STATUS_ICON: Record<VehicleStatus, string> = {
  on_route: '🚛',
  collecting: '♻️',
  idle: '🅿️',
  off_duty: '😴',
};

export default function MapScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(getVehicles);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drift vehicle positions every 8 seconds in demo mode
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setVehicles(driftVehicles());
    }, 8000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const center = {
    latitude: 8.5620,
    longitude: 76.9830,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  };

  return (
    <View style={styles.screen}>
      {DEMO_MODE && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>
            📡 DEMO MODE — Vehicle positions are simulated and update every 8 seconds
          </Text>
        </View>
      )}

      {/* Interactive map for web; native map for Android/iOS */}
      {Platform.OS === 'web' ? (
        <View style={styles.map}>
          {React.createElement('iframe', {
            title: 'Chakrava vehicle map',
            src: 'https://www.openstreetmap.org/export/embed.html?bbox=76.96%2C8.54%2C77.01%2C8.58&layer=mapnik&marker=8.562%2C76.983',
            width: '100%',
            height: '100%',
            style: {
              border: 0,
              minHeight: 300,
            },
          })}
        </View>
      ) : MapView ? (
        <MapView
          style={styles.map}
          initialRegion={center}
          showsUserLocation={false}
        >
          {vehicles.map(v => (
            <Marker
              key={v.id}
              coordinate={{ latitude: v.lat, longitude: v.lng }}
              title={v.vehicle_code}
              description={`${v.driver_name ?? 'Unassigned'} · ${v.status}`}
              onPress={() => setSelected(v)}
            >
              <View
                style={[
                  styles.markerBubble,
                  { backgroundColor: STATUS_COLOR[v.status] },
                ]}
              >
                <Text style={styles.markerEmoji}>
                  {STATUS_ICON[v.status]}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          <Text style={styles.mapFallbackTitle}>🗺️ Map View</Text>
          <Text style={styles.mapFallbackSub}>
            Native map unavailable.
            {'\n'}Vehicle positions shown below.
          </Text>
          <Text style={styles.mapFallbackCoord}>
            Area Centre: 8.5620°N, 76.9830°E
          </Text>
        </View>
      )}

      {/* Vehicle card list */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>
          Active Vehicles ({vehicles.filter(v => v.is_on_duty).length}/{vehicles.length})
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScroll}
        >
          {vehicles.map(v => (
            <Pressable
              key={v.id}
              style={[
                styles.vehicleCard,
                selected?.id === v.id && styles.vehicleCardSelected,
              ]}
              onPress={() =>
                setSelected(selected?.id === v.id ? null : v)
              }
            >
              <Text style={styles.vehicleEmoji}>
                {STATUS_ICON[v.status]}
              </Text>

              <Text style={styles.vehicleCode} numberOfLines={1}>
                {v.vehicle_code}
              </Text>

              <Text style={styles.vehicleDriver} numberOfLines={1}>
                {v.driver_name ?? 'Unassigned'}
              </Text>

              <StatusBadge
                variant={
                  v.status === 'on_route' || v.status === 'collecting'
                    ? 'active'
                    : 'idle'
                }
                label={v.status.replace('_', ' ')}
                small
              />

              <Text style={styles.vehicleCoord}>
                {v.lat.toFixed(4)}, {v.lng.toFixed(4)}
              </Text>

              <Text style={styles.vehicleUpdated}>
                Updated {formatRelativeTime(v.last_updated_at)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Selected vehicle detail panel */}
      {selected && (
        <View style={styles.detailPanel}>
          <View style={styles.detailRow}>
            <Text style={styles.detailEmoji}>
              {STATUS_ICON[selected.status]}
            </Text>

            <View style={styles.detailInfo}>
              <Text style={styles.detailCode}>
                {selected.vehicle_code}
              </Text>

              <Text style={styles.detailDriver}>
                {selected.driver_name ?? 'No driver assigned'}
              </Text>

              <Text style={styles.detailCoord}>
                📍 {selected.lat.toFixed(5)}°N, {selected.lng.toFixed(5)}°E
              </Text>
            </View>

            <StatusBadge
              variant={
                selected.status === 'on_route' ||
                selected.status === 'collecting'
                  ? 'active'
                  : 'idle'
              }
              label={selected.status.replace('_', ' ')}
            />
          </View>

          <Pressable
            style={styles.closeBtn}
            onPress={() => setSelected(null)}
          >
            <Text style={styles.closeBtnText}>✕ Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  demoBanner: {
    backgroundColor: '#1A5276',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
  },

  demoBannerText: {
    color: '#85C1E9',
    fontSize: Layout.fontSize.xs,
    textAlign: 'center',
  },

  map: {
    flex: 1,
    minHeight: 300,
  },

  mapFallback: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.xl,
    gap: Layout.spacing.sm,
    margin: Layout.spacing.md,
    borderRadius: Layout.radius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Colors.border,
  },

  mapFallbackTitle: {
    fontSize: Layout.fontSize.xxl,
    textAlign: 'center',
  },

  mapFallbackSub: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  mapFallbackCoord: {
    fontSize: Layout.fontSize.xs,
    color: Colors.muted,
  },

  markerBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.textInverse,
    ...Layout.shadow.md,
  },

  markerEmoji: {
    fontSize: 20,
  },

  listContainer: {
    backgroundColor: Colors.surface,
    paddingTop: Layout.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  listTitle: {
    fontSize: Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
    paddingHorizontal: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },

  hScroll: {
    paddingHorizontal: Layout.spacing.md,
    paddingBottom: Layout.spacing.md,
    gap: Layout.spacing.sm,
  },

  vehicleCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Layout.radius.lg,
    padding: Layout.spacing.md,
    minWidth: 150,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Layout.shadow.sm,
  },

  vehicleCardSelected: {
    borderColor: Colors.primary,
  },

  vehicleEmoji: {
    fontSize: 28,
  },

  vehicleCode: {
    fontSize: Layout.fontSize.sm,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  vehicleDriver: {
    fontSize: Layout.fontSize.xs,
    color: Colors.textSecondary,
  },

  vehicleCoord: {
    fontSize: 10,
    color: Colors.muted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  vehicleUpdated: {
    fontSize: 10,
    color: Colors.muted,
  },

  detailPanel: {
    backgroundColor: Colors.surface,
    padding: Layout.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Layout.spacing.sm,
    ...Layout.shadow.lg,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },

  detailEmoji: {
    fontSize: 36,
  },

  detailInfo: {
    flex: 1,
    gap: 2,
  },

  detailCode: {
    fontSize: Layout.fontSize.md,
    fontWeight: Layout.fontWeight.bold,
    color: Colors.text,
  },

  detailDriver: {
    fontSize: Layout.fontSize.sm,
    color: Colors.textSecondary,
  },

  detailCoord: {
    fontSize: Layout.fontSize.xs,
    color: Colors.muted,
  },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: Layout.spacing.sm,
  },

  closeBtnText: {
    fontSize: Layout.fontSize.sm,
    color: Colors.muted,
  },
});
