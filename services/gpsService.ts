
import * as Location from 'expo-location';
import type { LocationSubscription } from 'expo-location';

import { supabase, DEMO_MODE } from './supabase';

export async function startVehicleGpsTracking(
  vehicleCode: string,
  onLocation?: (latitude: number, longitude: number) => void
): Promise<LocationSubscription> {
  if (DEMO_MODE || !supabase) {
    throw new Error(
      'Supabase is not configured. GPS tracking requires a real Supabase connection.'
    );
  }

  const client = supabase;

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    throw new Error('Please log in before starting GPS tracking.');
  }

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error('Please allow Chakrava to access your location.');
  }

  let isSaving = false;

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 5,
    },
    async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      onLocation?.(latitude, longitude);

      if (isSaving) return;

      isSaving = true;

      try {
        const { error } = await client
          .from('vehicle_live_locations')
          .upsert(
            {
              vehicle_code: vehicleCode,
              latitude,
              longitude,
              accuracy_m: position.coords.accuracy,
              updated_at: new Date().toISOString(),
              updated_by: user.id,
            },
            {
              onConflict: 'vehicle_code',
            }
          );

        if (error) {
          console.error('GPS upload failed:', error.message);
        } else {
          console.log(
            'GPS location uploaded:',
            vehicleCode,
            latitude,
            longitude
          );
        }
      } catch (error) {
        console.error('GPS tracking error:', error);
      } finally {
        isSaving = false;
      }
    }
  );

  return subscription;
}
