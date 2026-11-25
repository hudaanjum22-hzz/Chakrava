
 // ============================================================
// Chakrava — Auth Hook
// ============================================================

import React, {
  useState,
  useEffect,
  createContext,
  useContext,
} from 'react';

import {
  login as loginService,
  logout as logoutService,
  restoreSession,
  type AuthSession,
} from '../services/authService';

import { DEMO_MODE, supabase } from '../services/supabase';
import type { UserRole } from '../types';

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  role: null,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const restoreAuth = async () => {
      try {
        const savedSession = await restoreSession();

        if (DEMO_MODE) {
          if (mounted) setSession(savedSession);
          return;
        }

        const { data, error } = await supabase!.auth.getSession();

        if (error) {
          console.error('Supabase restore error:', error.message);
        }

        // Both the app profile and Supabase login must exist.
        if (data.session && savedSession) {
          if (mounted) setSession(savedSession);
        } else {
          if (mounted) setSession(null);
        }
      } catch (error) {
        console.error('Auth restore error:', error);
        if (mounted) setSession(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    restoreAuth();

    const authListener = !DEMO_MODE && supabase
      ? supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT' && mounted) {
            setSession(null);
          }
        })
      : null;

    return () => {
      mounted = false;
      authListener?.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const newSession = await loginService(email, password);

    // Verify that Supabase has actually established the login.
    if (!newSession.isDemo && supabase) {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        throw new Error(
          'Login succeeded, but Supabase session was not found. Please log in again.',
        );
      }
    }

    setSession(newSession);
  };

  const logout = async () => {
    await logoutService();
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        role: session?.profile.role ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
