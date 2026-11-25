
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl: string =
  (Constants.expoConfig?.extra?.supabaseUrl as string) ?? '';

const supabaseAnonKey: string =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string) ?? '';

export const DEMO_MODE: boolean =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl === 'YOUR_SUPABASE_URL';

export const supabase = DEMO_MODE
  ? null
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
