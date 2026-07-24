import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import { User } from '../types';

interface SignUpParams {
  email: string;
  password: string;
  username: string;
}

interface SignInParams {
  email: string;
  password: string;
}

export async function signUp({ email, password, username }: SignUpParams) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    throw new Error('That username is already taken');
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  });

  if (error) throw error;
  return data;
}

export async function signIn({ email, password }: SignInParams) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google sign-in was cancelled');
  }

  const fragment = result.url.split('#')[1] ?? '';
  const params = new URLSearchParams(fragment);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (!access_token || !refresh_token) {
    throw new Error('Google sign-in did not return a valid session');
  }

  const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
  if (sessionError) throw sessionError;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUserProfile(
  userId: string,
  email: string,
  fallbackUsername: string
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as User;

  // No row yet — the handle_new_user DB trigger either hasn't been applied
  // or hasn't run yet. Create the profile row ourselves as a fallback.
  const { data: created, error: insertError } = await supabase
    .from('users')
    .insert({ id: userId, email, username: fallbackUsername })
    .select()
    .single();

  if (!insertError) return created as User;

  if (insertError.code === '23505') {
    if (insertError.message.includes('users_email_key')) {
      throw new Error(
        `An account already exists for ${email} under a different sign-in method (e.g. Google vs. email/password). Sign in with that method instead, or remove the old test user from Supabase (Authentication → Users) and try again.`
      );
    }
    if (insertError.message.includes('users_username_key')) {
      throw new Error('That username is already taken by another account.');
    }
  }

  throw insertError;
}
