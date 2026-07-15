import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getSupabaseClient } from './client';
import type { Tables, TablesInsert } from './types';

type UpdateRow = Tables<'updates'>;

type UpdateBase = {
  id: string;
  tripId: string;
  authorId: string;
  happenedAt: string;
  createdAt: string;
};

export type NoteUpdate = UpdateBase & { type: 'note'; body: string };
export type PhotoUpdate = UpdateBase & { type: 'photo'; mediaPath: string; body: string | null };
export type PurchaseUpdate = UpdateBase & {
  type: 'purchase';
  vendorName: string;
  amount: number;
  currency: string;
  body: string | null;
};
export type AttractionUpdate = UpdateBase & {
  type: 'attraction';
  placeName: string;
  amount: number | null;
  currency: string | null;
  body: string | null;
};

/** Discriminated union — type-specific fields are non-nullable per variant. */
export type Update = NoteUpdate | PhotoUpdate | PurchaseUpdate | AttractionUpdate;

export type NewUpdate =
  | { type: 'note'; body: string }
  | { type: 'photo'; mediaPath: string; body?: string | null }
  | { type: 'purchase'; vendorName: string; amount: number; currency: string; body?: string | null }
  | {
      type: 'attraction';
      placeName: string;
      amount?: number | null;
      currency?: string | null;
      body?: string | null;
    };

/** Rows that fail their variant's invariants (or reserved types like video) map to null. */
function mapRow(row: UpdateRow): Update | null {
  const base: UpdateBase = {
    id: row.id,
    tripId: row.trip_id,
    authorId: row.author_id,
    happenedAt: row.happened_at,
    createdAt: row.created_at,
  };
  switch (row.type) {
    case 'note':
      return row.body === null ? null : { ...base, type: 'note', body: row.body };
    case 'photo':
      return row.media_path === null
        ? null
        : { ...base, type: 'photo', mediaPath: row.media_path, body: row.body };
    case 'purchase':
      return row.vendor_name === null || row.amount === null || row.currency === null
        ? null
        : {
            ...base,
            type: 'purchase',
            vendorName: row.vendor_name,
            amount: row.amount,
            currency: row.currency,
            body: row.body,
          };
    case 'attraction':
      return row.place_name === null
        ? null
        : {
            ...base,
            type: 'attraction',
            placeName: row.place_name,
            amount: row.amount,
            currency: row.currency,
            body: row.body,
          };
    default:
      return null;
  }
}

export async function listUpdates(tripId: string): Promise<Update[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('updates')
    .select('*')
    .eq('trip_id', tripId)
    .order('happened_at', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(mapRow).filter((u): u is Update => u !== null);
}

export async function createUpdate(tripId: string, input: NewUpdate): Promise<Update> {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error('Not signed in.');

  const row: TablesInsert<'updates'> = {
    trip_id: tripId,
    author_id: userData.user.id,
    type: input.type,
    body: input.body ?? null,
  };
  if (input.type === 'note') {
    row.body = input.body;
  } else if (input.type === 'photo') {
    row.media_path = input.mediaPath;
  } else if (input.type === 'purchase') {
    row.vendor_name = input.vendorName.trim();
    row.amount = input.amount;
    row.currency = input.currency;
  } else {
    row.place_name = input.placeName.trim();
    row.amount = input.amount ?? null;
    row.currency = input.amount != null ? (input.currency ?? null) : null;
  }

  const { data, error } = await client.from('updates').insert(row).select().single();
  if (error) throw new Error(error.message);
  const mapped = mapRow(data);
  if (!mapped) throw new Error('Update saved but failed validation mapping.');
  return mapped;
}

export type BudgetLine = { currency: string; total: number; items: number };

export async function getTripBudget(tripId: string): Promise<BudgetLine[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('trip_budgets').select('*').eq('trip_id', tripId);
  if (error) throw new Error(error.message);
  return data
    .filter(
      (r): r is { trip_id: string; currency: string; total: number; items: number } =>
        r.currency !== null && r.total !== null && r.items !== null,
    )
    .map((r) => ({ currency: r.currency, total: r.total, items: r.items }));
}

export function useTripUpdates(tripId: string) {
  return useQuery({ queryKey: ['updates', tripId], queryFn: () => listUpdates(tripId) });
}

export function useTripBudget(tripId: string) {
  return useQuery({ queryKey: ['budget', tripId], queryFn: () => getTripBudget(tripId) });
}

export function useCreateUpdate(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUpdate) => createUpdate(tripId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['updates', tripId] });
      queryClient.invalidateQueries({ queryKey: ['budget', tripId] });
    },
  });
}
