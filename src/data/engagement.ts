import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useSession } from './auth';
import { getSupabaseClient } from './client';
import { requireUserId } from './storage';
import type { Trip } from './trips';

export type TripEngagement = { views: number; saves: number };

/** Batched per-trip counts from the trip_engagement view, keyed by trip id.
 *  Trips missing from the map simply have no rows yet — treat as zero. */
export async function getTripEngagement(
  tripIds: string[],
): Promise<Record<string, TripEngagement>> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('trip_engagement')
    .select('trip_id, view_count, save_count')
    .in('trip_id', tripIds);
  if (error) throw new Error(error.message);
  const map: Record<string, TripEngagement> = {};
  for (const row of data) {
    if (row.trip_id) map[row.trip_id] = { views: row.view_count ?? 0, saves: row.save_count ?? 0 };
  }
  return map;
}

async function recordView(tripId: string): Promise<void> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { error } = await client
    .from('trip_views')
    .upsert({ trip_id: tripId, user_id: userId }, { ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function getIsTripSaved(tripId: string): Promise<boolean> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { data, error } = await client
    .from('trip_saves')
    .select('trip_id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function saveTrip(tripId: string): Promise<void> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { error } = await client.from('trip_saves').insert({ trip_id: tripId, user_id: userId });
  // 23505 = already saved (PK hit) — the state we wanted, not an error.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unsaveTrip(tripId: string): Promise<void> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { error } = await client
    .from('trip_saves')
    .delete()
    .eq('trip_id', tripId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export function useTripEngagement(tripIds: string[]) {
  return useQuery({
    queryKey: ['engagement', [...tripIds].sort().join(',')],
    queryFn: () => getTripEngagement(tripIds),
    enabled: tripIds.length > 0,
  });
}

/** Records the signed-in reader's view of a published trip they don't own —
 *  idempotent (one row per user per trip; RLS re-enforces every guard). */
export function useRecordTripView(trip: Pick<Trip, 'id' | 'owner_id' | 'status'>) {
  const { session } = useSession();
  const isReader = !!session && session.user.id !== trip.owner_id && trip.status === 'published';
  const { mutate } = useMutation({ mutationFn: recordView });
  useEffect(() => {
    if (isReader) mutate(trip.id);
  }, [isReader, trip.id, mutate]);
}

/** Save state for a trip the signed-in user doesn't own. */
export function useIsTripSaved(tripId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['saves', 'is-saved', tripId],
    queryFn: () => getIsTripSaved(tripId),
    enabled,
  });
}

function useToggleSave(mutationFn: (tripId: string) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, tripId) => {
      queryClient.invalidateQueries({ queryKey: ['saves', 'is-saved', tripId] });
      queryClient.invalidateQueries({ queryKey: ['engagement'] });
    },
  });
}

export const useSaveTrip = () => useToggleSave(saveTrip);
export const useUnsaveTrip = () => useToggleSave(unsaveTrip);
