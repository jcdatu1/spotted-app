import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PreparedImage } from '@/lib/images';

import { getSupabaseClient } from './client';
import { removeObjects, requireUserId, uniqueObjectName, uploadImage } from './storage';
import type { Tables } from './types';

export type Trip = Tables<'trips'>;
export type TripOwner = { username: string; display_name: string };
export type TripWithOwner = Trip & { owner: TripOwner };
export type TripWithStops = Trip & { stops: number };

/** Draft / Live / Completed — always derived from status + dates at read
 *  time, never stored, so trips roll over with no scheduled transitions. */
export type TripState = 'draft' | 'live' | 'completed';

const OWNER_JOIN = '*, owner:profiles!trips_owner_id_fkey(username, display_name)';

const COVER_BUCKET = 'trip-media';

/** Device-local calendar date as YYYY-MM-DD — string-comparable to `date`
 *  columns without Date-object timezone traps. */
export function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function getTripState(trip: Pick<Trip, 'status' | 'end_date'>): TripState {
  if (trip.status === 'draft') return 'draft';
  if (trip.end_date && trip.end_date < localToday()) return 'completed';
  return 'live';
}

/** Why publish is unavailable, or null when it can proceed. The DB CHECK
 *  backstops 'not-started'; 'missing-dates' covers trips that predate the
 *  date columns. */
export function getPublishBlocker(
  trip: Pick<Trip, 'status' | 'start_date' | 'end_date'>,
): 'missing-dates' | 'not-started' | null {
  if (!trip.start_date || !trip.end_date) return 'missing-dates';
  if (trip.start_date > localToday()) return 'not-started';
  return null;
}

export type TripDetailsInput = {
  title: string;
  description?: string | null;
  countryCodes: string[];
  startDate: string;
  endDate: string;
  cover?: PreparedImage | null;
};

async function uploadTripCover(image: PreparedImage): Promise<string> {
  const uid = await requireUserId();
  const path = `${uid}/covers/${uniqueObjectName('cover', image.extension)}`;
  return uploadImage(COVER_BUCKET, path, image);
}

export async function createTrip(input: TripDetailsInput): Promise<Trip> {
  const client = getSupabaseClient();
  const ownerId = await requireUserId();
  // Upload precedes the row write so a row never references a missing file.
  const coverPath = input.cover ? await uploadTripCover(input.cover) : null;
  const { data, error } = await client
    .from('trips')
    .insert({
      owner_id: ownerId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      country_codes: input.countryCodes,
      start_date: input.startDate,
      end_date: input.endDate,
      cover_path: coverPath,
    })
    .select()
    .single();
  if (error) {
    if (coverPath) await removeObjects(COVER_BUCKET, [coverPath]).catch(() => {});
    throw new Error(error.message);
  }
  return data;
}

export async function updateTrip(trip: Trip, input: TripDetailsInput): Promise<Trip> {
  if (trip.status !== 'draft') throw new Error('Only draft trips can be edited.');
  const client = getSupabaseClient();
  const newCoverPath = input.cover ? await uploadTripCover(input.cover) : null;
  const { data, error } = await client
    .from('trips')
    .update({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      country_codes: input.countryCodes,
      start_date: input.startDate,
      end_date: input.endDate,
      ...(newCoverPath ? { cover_path: newCoverPath } : {}),
    })
    .eq('id', trip.id)
    .select()
    .single();
  if (error) {
    if (newCoverPath) await removeObjects(COVER_BUCKET, [newCoverPath]).catch(() => {});
    throw new Error(error.message);
  }
  if (newCoverPath && trip.cover_path) {
    await removeObjects(COVER_BUCKET, [trip.cover_path]).catch(() => {});
  }
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

export function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ trip, input }: { trip: Trip; input: TripDetailsInput }) =>
      updateTrip(trip, input),
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
