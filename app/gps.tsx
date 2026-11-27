
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { LocationSubscription } from 'expo-location';
import * as Location from 'expo-location';

import { startVehicleGpsTracking } from '../services/gpsService';
import { DEMO_VEHICLES } from '../constants/DemoData';

const VEHICLES = DEMO_VEHICLES.map(vehicle => vehicle.vehicle_code);

export default function VehicleGpsScreen() {
  const router = useRouter();

  const [selectedVehicle, setSelectedVehicle] = useState(VEHICLES[0]);
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState('GPS tracking is stopped');
  const [coordinates, setCoordinates] = useState('Waiting for GPS...');
  const [address, setAddress] = useState('Waiting for location...');
  const lastGeocodeRef = useRef(0);
  const subscriptionRef = useRef<LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  const startTracking = async () => {
    try {
      setStatus('Requesting GPS permission...');

      const subscription = await startVehicleGpsTracking(
        selectedVehicle,
        (latitude, longitude) => {
          setCoordinates(
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          );

          // Reverse-geocode at most once every 30 seconds
          const now = Date.now();

          if (now - lastGeocodeRef.current >= 30000) {
            lastGeocodeRef.current = now;

            Location.reverseGeocodeAsync({ latitude, longitude })
              .then((results) => {
                const place = results[0];

                if (place) {
                  const parts = [
                    place.name,
                    place.street,
                    place.district,
                    place.subregion,
                    place.city,
                    place.region,
                    place.postalCode,
                    place.country,
                  ].filter(Boolean);

                  setAddress(
                    [...new Set(parts)].join(', ') ||
                    'Address not available'
                  );
                } else {
                  setAddress('Address not available');
                }
              })
              .catch(() => {
                setAddress('Unable to fetch address. Coordinates are available.');
              });
          }

          setStatus('GPS active · Sending location to Supabase');
        }
      );

      subscriptionRef.current = subscription;
      setTracking(true);
      setStatus('GPS tracking started');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start GPS tracking';

      setStatus(message);
    }
  };

  const stopTracking = () => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    setTracking(false);
    setStatus('GPS tracking stopped');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Vehicle GPS Tracking</Text>
      <Text style={styles.subtitle}>
        Send the phone's real GPS location to Chakrava.
      </Text>

      <Text style={styles.label}>Select vehicle</Text>

      {VEHICLES.map((vehicle) => (
        <Pressable
          key={vehicle}
          disabled={tracking}
          onPress={() => setSelectedVehicle(vehicle)}
          style={[
            styles.vehicleButton,
            selectedVehicle === vehicle && styles.selectedVehicle,
          ]}
        >
          <Text
            style={[
              styles.vehicleText,
              selectedVehicle === vehicle && styles.selectedText,
            ]}
          >
            {vehicle}
          </Text>
        </Pressable>
      ))}

      <View style={styles.locationCard}>
        <Text style={styles.cardLabel}>Current location</Text>
        <Text style={styles.coordinates}>{address}</Text>

        <Text style={[styles.cardLabel, { marginTop: 18 }]}>
          Current GPS coordinates
        </Text>
        <Text style={styles.coordinates}>{coordinates}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>

      {!tracking ? (
        <Pressable onPress={startTracking} style={styles.startButton}>
          <Text style={styles.buttonText}>Start GPS Tracking</Text>
        </Pressable>
      ) : (
        <Pressable onPress={stopTracking} style={styles.stopButton}>
          <Text style={styles.buttonText}>Stop GPS Tracking</Text>
        </Pressable>
      )}

      <Text style={styles.note}>
        Keep this screen open while the vehicle is moving.
        GPS updates are sent to Supabase while tracking is active.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 22,
    paddingTop: 50,
    backgroundColor: '#F5F8F5',
    flexGrow: 1,
  },
  back: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    color: '#256B45',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#173D2B',
  },
  subtitle: {
    fontSize: 14,
    color: '#65756A',
    marginTop: 8,
    marginBottom: 28,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#243B2D',
  },
  vehicleButton: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE5DD',
    marginBottom: 10,
  },
  selectedVehicle: {
    backgroundColor: '#E1F2E6',
    borderColor: '#287A4B',
  },
  vehicleText: {
    color: '#34483A',
    fontWeight: '600',
  },
  selectedText: {
    color: '#1C6A3B',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 13,
    color: '#68776D',
  },
  coordinates: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#173D2B',
    marginTop: 10,
  },
  status: {
    fontSize: 13,
    color: '#287A4B',
    marginTop: 12,
  },
  startButton: {
    backgroundColor: '#247A48',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#B83232',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  note: {
    color: '#68776D',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
});
