import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

let globalSession: Session | null = null;
let globalUser: User | null = null;
let globalLoading = true;
let initialized = false;
let listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach((l) => l());
}

async function syncProfileFromMetadata(user: User) {
  const meta = user.user_metadata as
    | { full_name?: unknown; role?: unknown }
    | undefined;
  const fullName =
    typeof meta?.full_name === 'string' ? meta.full_name.trim() : '';
  const role =
    meta?.role === 'teacher' || meta?.role === 'student' ? meta.role : null;

  if (!fullName && !role) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  try {
    if (!profile) {
      await supabase.from('profiles').upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: fullName || null,
          role: role ?? 'student',
        },
        { onConflict: 'id' }
      );
      return;
    }

    const updates: { full_name?: string; role?: 'teacher' | 'student' } = {};
    if (fullName && !profile.full_name) {
      updates.full_name = fullName;
    }
    if (role === 'teacher' && profile.role !== 'teacher') {
      updates.role = 'teacher';
    }
    if (Object.keys(updates).length > 0) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
  } catch {
    // Profile sync is best-effort; never block sign-in on it.
  }
}

async function initAuth() {
  if (initialized) return;
  initialized = true;
  try {
    const { data } = await supabase.auth.getSession();
    globalSession = data.session;
    globalUser = data.session?.user ?? null;
    if (data.session?.user) {
      syncProfileFromMetadata(data.session.user).catch(() => {});
    }
  } catch {
    globalSession = null;
    globalUser = null;
  } finally {
    globalLoading = false;
    notify();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    globalSession = session;
    globalUser = session?.user ?? null;
    globalLoading = false;
    notify();
  });
}

export function setAuth(session: Session | null) {
  globalSession = session;
  globalUser = session?.user ?? null;
  globalLoading = false;
  notify();
}

export function useAuth(): AuthState {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((n) => n + 1);
    listeners.add(listener);
    initAuth();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session: globalSession,
    user: globalUser,
    loading: globalLoading,
  };
}

export type SignUpProfile = {
  full_name: string;
  role: 'student' | 'teacher';
};

export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes('unable to resolve host') ||
    m.includes('fetch failed') ||
    m.includes('failed to fetch') ||
    m.includes('network request failed')
  ) {
    return 'Cannot reach Supabase. Check your internet connection and make sure EXPO_PUBLIC_SUPABASE_URL in .env is the correct, active project URL.';
  }
  if (m.includes('invalid api key')) {
    return 'Invalid Supabase key. Check EXPO_PUBLIC_SUPABASE_ANON_KEY in .env and restart Expo.';
  }
  return message;
}

export async function signUp(
  email: string,
  password: string,
  profile?: SignUpProfile
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: profile
        ? { full_name: profile.full_name, role: profile.role }
        : undefined,
    },
  });
  if (!error && data.session && profile) {
    // The trigger creates the profile row on signup. It reads the
    // metadata above, and this upsert covers projects where the
    // updated trigger has not been applied yet.
    await supabase.from('profiles').upsert(
      {
        id: data.session.user.id,
        email: data.session.user.email ?? email,
        full_name: profile.full_name,
        role: profile.role,
      },
      { onConflict: 'id' }
    );
  }
  if (!error && data.session) {
    setAuth(data.session);
  }
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error && data.session) {
    setAuth(data.session);
    try {
      await syncProfileFromMetadata(data.session.user);
    } catch {
      // Ignore profile sync errors; auth itself succeeded.
    }
  }
  return { data, error };
}

export async function signOut() {
  setAuth(null);
  supabase.auth.signOut().catch(() => {});
  return { error: null };
}
