import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSupabaseClient } from './client';
import type { Tables } from './types';

export type Trip = Tables<'trips'>;
export type TripOwner = { username: string; display_name: string };
export type TripWithOwner = Trip & { owner: TripOwner };
export type TripWithStops = Trip & { stops: number };

const OWNER_JOIN = '*, owner:profiles!trips_owner_id_fkey(username, display_name)';

async function requireUserId(): Promise<string> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}

export async function createTrip(input: {
  title: string;
  description?: string | null;
}): Promise<Trip> {
  const client = getSupabaseClient();
  const ownerId = await requireUserId();
  const { data, error } = await client
    .from('trips')
    .insert({
      owner_id: ownerId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTrip(id: string): Promise<TripWithOwner | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('trips').select(OWNER_JOIN).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function publishTrip(id: string): Promise<Trip> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('trips')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function listMyTrips(): Promise<TripWithStops[]> {
  const client = getSupabaseClient();
  const ownerId = await requireUserId();
  const { data, error } = await client
    .from('trips')
    .select('*, updates(count)')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(({ updates, ...trip }) => ({ ...trip, stops: updates[0]?.count ?? 0 }));
}

export async function listPublishedTrips(): Promise<TripWithOwner[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('trips')
    .select(OWNER_JOIN)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return data;
}

export function useTrip(id: string) {
  return useQuery({ queryKey: ['trips', 'detail', id], queryFn: () => getTrip(id) });
}

export function useMyTrips() {
  return useQuery({ queryKey: ['trips', 'mine'], queryFn: listMyTrips });
}

export function usePublishedTrips() {
  return useQuery({ queryKey: ['trips', 'published'], queryFn: listPublishedTrips });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function usePublishTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishTrip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}
