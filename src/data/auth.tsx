import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getSupabaseClient } from './client';

type SessionState = { session: Session | null; isLoading: boolean };

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseClient();
    let active = true;

    client.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ session, isLoading }), [session, isLoading]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Current auth session. `isLoading` is true only during initial restore. */
export function useSession(): SessionState {
  return useContext(SessionContext);
}

function friendlyAuthError(message: string): string {
  if (message.includes('Database error saving new user')) {
    return 'That username is taken or invalid.';
  }
  if (message.includes('Invalid login credentials')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('already registered')) {
    return 'An account with this email already exists.';
  }
  return message;
}

export async function signUp(params: {
  email: string;
  password: string;
  username: string;
  displayName: string;
}): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      // Read by the handle_new_user trigger to provision the profile row.
      data: {
        username: params.username.trim().toLowerCase(),
        display_name: params.displayName.trim(),
      },
    },
  });
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function signIn(email: string, password: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(friendlyAuthError(error.message));
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
}
