import { useQuery } from '@tanstack/react-query';

import { searchCountries, type Country } from '@/lib/countries';

import { getSupabaseClient } from './client';
import type { Profile } from './profiles';
import { OWNER_JOIN, type TripWithOwner } from './trips';

export const MIN_SEARCH_LENGTH = 2;
const COUNTRY_LIMIT = 5;
const SECTION_LIMIT = 10;

export type SearchResults = {
  countries: Country[];
  users: Profile[];
  trips: TripWithOwner[];
};

/** Match the user's text literally: escape ILIKE wildcards and drop the
 *  characters PostgREST's or() filter syntax reserves. */
function toLikePattern(term: string): string {
  const cleaned = term.replace(/[,()]/g, ' ').trim();
  return `%${cleaned.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}

/** Simple ILIKE search, capped per section — internals are swappable for a
 *  ranked search RPC / pg_trgm later without changing the hook's shape.
 *  Countries resolve client-side from the static list (no network). Trip RLS
 *  already hides other users' drafts; the status filter states the intent. */
export async function searchAll(term: string): Promise<SearchResults> {
  const client = getSupabaseClient();
  const pattern = toLikePattern(term);
  const [profilesRes, tripsRes] = await Promise.all([
    client
      .from('profiles')
      .select('*')
      .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
      .order('username')
      .limit(SECTION_LIMIT),
    client
      .from('trips')
      .select(OWNER_JOIN)
      .eq('status', 'published')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('published_at', { ascending: false })
      .limit(SECTION_LIMIT),
  ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (tripsRes.error) throw new Error(tripsRes.error.message);
  return {
    countries: searchCountries(term).slice(0, COUNTRY_LIMIT),
    users: profilesRes.data,
    trips: tripsRes.data,
  };
}

export function useSearch(term: string) {
  const normalized = term.trim();
  return useQuery({
    queryKey: ['search', normalized.toLowerCase()],
    queryFn: () => searchAll(normalized),
    enabled: normalized.length >= MIN_SEARCH_LENGTH,
  });
}
