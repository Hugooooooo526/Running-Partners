import React, { createContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import * as authService from '../services/authService';
import { User } from '../types';

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  profileError: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<{ session: Session | null }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (authUser: SupabaseUser) => {
    try {
      const fallbackUsername =
        (authUser.user_metadata?.username as string | undefined) ?? authUser.email!.split('@')[0];
      const userProfile = await authService.getUserProfile(authUser.id, authUser.email!, fallbackUsername);
      setProfile(userProfile);
      setProfileError(null);
    } catch (e) {
      console.error('Failed to load user profile', e);
      setProfile(null);
      setProfileError(e instanceof Error ? e.message : 'Failed to load your profile');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      if (initialSession) await loadProfile(initialSession.user);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await loadProfile(newSession.user);
      } else {
        setProfile(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await authService.signIn({ email, password });
  };

  const signUp = async (email: string, password: string, username: string) => {
    const data = await authService.signUp({ email, password, username });
    return { session: data.session };
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const refreshProfile = async () => {
    if (session) await loadProfile(session.user);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        profileError,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
