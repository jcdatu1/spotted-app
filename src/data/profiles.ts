import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from './auth';
import { getSupabaseClient } from './client';
import type { Tables } from './types';

export type Profile = Tables<'profiles'>;

export type ProfilePatch = {
  display_name?: string;
  bio?: string | null;
};

async function requireUserId(): Promise<string> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}

export async function getMyProfile(): Promise<Profile> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateMyProfile(patch: ProfilePatch): Promise<Profile> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { data, error } = await client
    .from('profiles')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/** Callable while signed out (security-definer RPC) — used by the sign-up form pre-check. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('username_available', { name: username.trim() });
  if (error) throw new Error(error.message);
  return data;
}

export function useMyProfile() {
  const { session } = useSession();
  return useQuery({
    queryKey: ['my-profile', session?.user.id],
    queryFn: getMyProfile,
    enabled: !!session,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-profile'] });
    },
  });
}
