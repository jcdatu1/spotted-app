import { useQuery } from '@tanstack/react-query';

import { getSupabaseClient } from './client';

const BUCKET = 'trip-media';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type PickedImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function extensionFor(image: PickedImage): string {
  const fromName = image.fileName?.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (image.mimeType?.includes('png')) return 'png';
  if (image.mimeType?.includes('webp')) return 'webp';
  return 'jpg';
}

/**
 * Uploads a picked image to the caller's own prefix ({uid}/{tripId}/...) in the
 * private trip-media bucket and returns the storage path. Throws on failure —
 * callers must not create a photo update row unless this succeeds.
 */
export async function uploadTripPhoto(tripId: string, image: PickedImage): Promise<string> {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) throw new Error('Not signed in.');

  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${userData.user.id}/${tripId}/${unique}.${extensionFor(image)}`;

  const response = await fetch(image.uri);
  const body = await response.arrayBuffer();

  const { error } = await client.storage.from(BUCKET).upload(path, body, {
    contentType: image.mimeType ?? 'image/jpeg',
  });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

async function createSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}

/** Batched signed URLs for a thread's photos; refetches before the URLs expire. */
export function useSignedPhotoUrls(paths: string[]) {
  const key = [...paths].sort();
  return useQuery({
    queryKey: ['signed-urls', key],
    queryFn: () => createSignedUrls(key),
    enabled: key.length > 0,
    staleTime: (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000,
  });
}
