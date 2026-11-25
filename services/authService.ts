
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEMO_MODE, supabase } from './supabase';

import {
  DEMO_CREDENTIALS,
  DEMO_PROFILES,
} from '../constants/DemoData';

import type { Profile } from '../types';

const SESSION_KEY = '@chakrava_session';

export interface AuthSession {
  profile: Profile;
  token?: string;
  isDemo: boolean;
}

export const login = async (
  email: string,
  password: string,
): Promise<AuthSession> => {
  const cleanEmail = email.trim().toLowerCase();

  // Demo login
  if (DEMO_MODE) {
    const credential = DEMO_CREDENTIALS.find(
      item =>
        item.email.toLowerCase() === cleanEmail &&
        item.password === password,
    );

    if (!credential) {
      throw new Error(
        'Demo login failed. Please check the demo credentials.',
      );
    }

    const profile = DEMO_PROFILES.find(
      item => item.email.toLowerCase() === cleanEmail,
    );

    if (!profile) {
      throw new Error('Demo profile not found.');
    }

    const session: AuthSession = {
      profile,
      isDemo: true,
    };

    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session),
    );

    return session;
  }

  // Real Supabase login
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Check your app configuration.',
    );
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

  if (error) {
    throw new Error(`Supabase login failed: ${error.message}`);
  }

  if (!data.user || !data.session) {
    throw new Error(
      'Supabase did not return a valid user session.',
    );
  }

  // Explicitly establish the session in the Supabase client
  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });

  if (sessionError || !sessionData.session) {
    throw new Error(
      `Unable to establish Supabase session: ${
        sessionError?.message ?? 'Session was not returned.'
      }`,
    );
  }

  // Fetch the signed-in user's profile
  const { data: profileData, error: profileError } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

  if (profileError) {
    throw new Error(
      `Login succeeded, but profile loading failed: ${profileError.message}`,
    );
  }

  if (!profileData) {
    throw new Error(
      'Your account is authenticated, but no profile exists for it in the profiles table.',
    );
  }

  const session: AuthSession = {
    profile: profileData as Profile,
    token: sessionData.session.access_token,
    isDemo: false,
  };

  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session),
  );

  return session;
};

export const restoreSession =
  async (): Promise<AuthSession | null> => {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  };

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem(SESSION_KEY);

  if (!DEMO_MODE && supabase) {
    await supabase.auth.signOut();
  }
};
