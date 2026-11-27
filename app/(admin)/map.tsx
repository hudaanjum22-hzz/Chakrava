import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { getVehicles, driftVehicles } from '../../services/demoService';
import { supabase, DEMO_MODE } from '../../services/supabase';
import { formatRelativeTime } from '../../utils/formatters';
import type { Vehicle, VehicleStatus } from '../../types';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const RNMaps = require('react-native-maps');
    MapView = RNMaps.default;
    Marker = RNMaps.Marker;
    Polyline = RNMaps.Polyline;
  } catch {}
}

const STATUS_COLOR: Record<VehicleStatus, string> = {
  on_route: '#16A34A',
  collecting: '#F59E0B',
  idle: '#64748B',
  off_duty: '#CBD5E1',
};

const STATUS_ICON: Record<VehicleStatus, string> = {
  on_route: '🚛',
  collecting: '♻️',
  idle: '🅿️',
  off_duty: '😴',
};

const CENTER = {
  latitude: 8.562,
  longitude: 76.983,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export default function MapScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(getVehicles);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [liveGpsReceived, setLiveGpsReceived] = useState(false);

  useEffect(() => {
    if (DEMO_MODE || !supabase) {
      const timer = setInterval(() => {
        const next = driftVehicles();
        setVehicles(next);
        setSelected(current =>
          current ? next.find(v => v.id === current.id) ?? current : null
        );
      }, 3000);
      return () => clearInterval(timer);
    }

    const client = supabase;
    let mounted = true;

    const updateVehicle = (row: any) => {
      if (!row?.vehicle_code) return;

      setVehicles(current =>
        current.map(vehicle =>
          vehicle.vehicle_code === row.vehicle_code
            ? {
                ...vehicle,
                lat: Number(row.latitude),
                lng: Number(row.longitude),
                last_updated_at: row.updated_at,
              }
            : vehicle
        )
      );

      setSelected(current => {
        if (!current || current.vehicle_code !== row.vehicle_code) {
          return current;
        }
        return {
          ...current,
          lat: Number(row.latitude),
          lng: Number(row.longitude),
          last_updated_at: row.updated_at,
        };
      });

      setLiveGpsReceived(true);
    };

    const loadLocations = async () => {
      const { data, error } = await client
        .from('vehicle_live_locations')
        .select('vehicle_code, latitude, longitude, updated_at');

      if (error) {
        console.error('GPS location loading error:', error.message);
        return;
      }

      if (mounted && data) data.forEach(updateVehicle);
    };

    loadLocations();

    const channel = client
      .channel('chakrava-map-live-gps')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_live_locations',
        },
        payload => {
          if (mounted && payload.new) updateVehicle(payload.new);
        }
      )
      .subscribe(status => {
        console.log('Map realtime:', status);
      });

    return () => {
      mounted = false;
      client.removeChannel(channel);
    };
  }, []);

  const activeVehicles = vehicles.filter(v => v.is_on_duty);
  const liveLabel = DEMO_MODE
    ? 'DEMO GPS'
    : liveGpsReceived
    ? 'LIVE GPS'
    : 'WAITING FOR GPS';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CHAKRAVA FLEET</Text>
          <Text style={styles.title}>Vehicle Tracking</Text>
          <Text style={styles.subtitle}>Vattiyoorkavu Grama Panchayat</Text>
        </View>
        <View style={styles.livePill}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: DEMO_MODE ? '#F59E0B' : '#22C55E' },
            ]}
          />
          <Text style={styles.liveText}>{liveLabel}</Text>
        </View>
      </View>

      <View style={styles.mapHeading}>
        <View>
          <Text style={styles.mapHeadingTitle}>Live fleet map</Text>
          <Text style={styles.mapHeadingSub}>
            {activeVehicles.length} vehicles on duty
          </Text>
        </View>
        <View style={styles.mapTag}>
          <Text style={styles.mapTagText}>● Tracking</Text>
        </View>
      </View>

      <View style={styles.map}>
        {Platform.OS === 'web' ? (
          <>
            {React.createElement('iframe', {
              title: 'Chakrava live fleet map',
              src: 'https://www.openstreetmap.org/export/embed.html?bbox=76.96%2C8.54%2C77.01%2C8.58&layer=mapnik&marker=8.562%2C76.983',
              width: '100%',
              height: '100%',
              style: { border: 0, minHeight: 300 },
            })}
            <View pointerEvents="box-none" style={styles.webMarkerLayer}>
              {vehicles.map(v => {
                const x = Math.max(
                  5,
                  Math.min(95, ((v.lng - 76.96) / 0.05) * 100)
                );
                const y = Math.max(
                  8,
                  Math.min(90, (1 - (v.lat - 8.54) / 0.04) * 100)
                );
                return (
                  <Pressable
                    key={v.id}
                    onPress={() => setSelected(v)}
                    style={[
                      styles.webMarker,
                      {
                        left: `${x}%`,
                        top: `${y}%`,
                        backgroundColor: STATUS_COLOR[v.status],
                      },
                    ]}
                  >
                    <Text style={styles.markerEmoji}>
                      {STATUS_ICON[v.status]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : MapView ? (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={CENTER}
            showsUserLocation={false}
          >
            {vehicles.map(v => (
              <Marker
                key={v.id}
                coordinate={{ latitude: v.lat, longitude: v.lng }}
                title={v.vehicle_code}
                description={`${v.driver_name ?? 'Driver'} · ${v.status}`}
                onPress={() => setSelected(v)}
              >
                <View
                  style={[
                    styles.nativeMarker,
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
            <Text style={styles.markerEmoji}>🗺️</Text>
            <Text style={styles.fallbackTitle}>Map unavailable</Text>
            <Text style={styles.fallbackText}>
              Vehicle locations are listed below.
            </Text>
          </View>
        )}

        <View style={styles.mapLegend}>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.legendText}>On route</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Collecting</Text>
          </View>
        </View>

        <View style={styles.mapFooter}>
          <Text style={styles.mapFooterText}>
            📍 Vattiyoorkavu service area
          </Text>
        </View>
      </View>

      <View style={styles.fleetSection}>
        <View style={styles.fleetHeader}>
          <View>
            <Text style={styles.fleetTitle}>Your fleet</Text>
            <Text style={styles.fleetSubtitle}>
              Select a vehicle to view details
            </Text>
          </View>
          <Text style={styles.fleetCount}>
            {activeVehicles.length}/{vehicles.length}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleList}
        >
          {vehicles.map(v => (
            <Pressable
              key={v.id}
              onPress={() =>
                setSelected(current => current?.id === v.id ? null : v)
              }
              style={[
                styles.vehicleCard,
                selected?.id === v.id && styles.vehicleCardSelected,
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.vehicleIconBox,
                    { backgroundColor: STATUS_COLOR[v.status] + '20' },
                  ]}
                >
                  <Text style={styles.vehicleIcon}>
                    {STATUS_ICON[v.status]}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLOR[v.status] },
                  ]}
                />
              </View>
              <Text style={styles.vehicleCode}>{v.vehicle_code}</Text>
              <Text style={styles.driverName}>
                {v.driver_name ?? 'Driver unassigned'}
              </Text>
              <Text style={styles.vehicleStatus}>
                {v.status.replace('_', ' ').toUpperCase()}
              </Text>
              <Text style={styles.updatedText}>
                Updated {formatRelativeTime(v.last_updated_at)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {selected && (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <View>
              <Text style={styles.detailLabel}>SELECTED VEHICLE</Text>
              <Text style={styles.detailTitle}>{selected.vehicle_code}</Text>
              <Text style={styles.detailDriver}>
                Driver: {selected.driver_name ?? 'Not assigned'}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setSelected(null)}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.detailBottom}>
            <View>
              <Text style={styles.coordinateLabel}>CURRENT LOCATION</Text>
              <Text style={styles.coordinateValue}>
                {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
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
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F8F5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#16834A',
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#163B2A',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#718078',
    marginTop: 3,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#176B3D',
  },
  mapHeading: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mapHeadingTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#183C2B',
  },
  mapHeadingSub: {
    fontSize: 11,
    color: '#7A8980',
    marginTop: 3,
  },
  mapTag: {
    backgroundColor: '#E5F4E9',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16834A',
  },
  map: {
    flex: 1,
    minHeight: 270,
    marginHorizontal: 14,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E6EEE7',
  },
  webMarkerLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 5,
  },
  webMarker: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -19 }, { translateY: -19 }],
    elevation: 5,
  },
  nativeMarker: {
    width: 42,
    height: 42,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 19,
  },
  mapLegend: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    gap: 6,
    elevation: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#425449',
  },
  mapFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 3,
  },
  mapFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#344E3D',
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#183C2B',
  },
  fallbackText: {
    fontSize: 12,
    color: '#718078',
  },
  fleetSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: 14,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  fleetHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fleetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#183C2B',
  },
  fleetSubtitle: {
    fontSize: 11,
    color: '#7A8980',
    marginTop: 3,
  },
  fleetCount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16834A',
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
  },
  vehicleList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 10,
  },
  vehicleCard: {
    width: 158,
    backgroundColor: '#F7FAF7',
    borderWidth: 1.5,
    borderColor: '#E6EDE7',
    borderRadius: 16,
    padding: 13,
  },
  vehicleCardSelected: {
    borderColor: '#16834A',
    backgroundColor: '#F0FAF3',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vehicleIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    fontSize: 20,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  vehicleCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#183C2B',
  },
  driverName: {
    fontSize: 10,
    color: '#718078',
    marginTop: 4,
  },
  vehicleStatus: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16834A',
    marginTop: 9,
  },
  updatedText: {
    fontSize: 9,
    color: '#94A098',
    marginTop: 5,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDEBE0',
    elevation: 3,
  },
  detailTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: '800',
    color: '#16834A',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#183C2B',
    marginTop: 4,
  },
  detailDriver: {
    fontSize: 11,
    color: '#718078',
    marginTop: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 15,
    color: '#526257',
  },
  detailBottom: {
    borderTopWidth: 1,
    borderTopColor: '#EAF0EA',
    marginTop: 12,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordinateLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A098',
  },
  coordinateValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#344E3D',
    marginTop: 4,
  },
});
