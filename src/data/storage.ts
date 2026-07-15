import { useQuery } from '@tanstack/react-query';

import type { PreparedImage } from '@/lib/images';

import { getSupabaseClient } from './client';

/** Buckets are provisioned by migration with own-prefix ({uid}/...) write
 *  policies. Access mode is a per-bucket choice: private buckets resolve
 *  display URLs via batched signed URLs, public buckets via stable URLs. */
export type AppBucket = 'trip-media' | 'profile-media';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function requireUserId(): Promise<string> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}

/** Unguessable object name — replaced media always gets a fresh URL, so image
 *  caches invalidate naturally and the predecessor can be deleted. */
export function uniqueObjectName(label: string, extension: string): string {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${label}-${unique}.${extension}`;
}

export async function uploadImage(
  bucket: AppBucket,
  path: string,
  image: PreparedImage,
): Promise<string> {
  const client = getSupabaseClient();
  const response = await fetch(image.uri);
  const body = await response.arrayBuffer();
  const { error } = await client.storage.from(bucket).upload(path, body, {
    contentType: image.mimeType,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}

export function publicUrl(bucket: AppBucket, path: string): string {
  return getSupabaseClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function removeObjects(bucket: AppBucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const client = getSupabaseClient();
  const { error } = await client.storage.from(bucket).remove(paths);
  if (error) throw new Error(error.message);
}

async function createSignedUrls(
  bucket: AppBucket,
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(error.message);
  const map: Record<string, string> = {};
  for (const entry of data) {
    if (entry.path && entry.signedUrl) map[entry.path] = entry.signedUrl;
  }
  return map;
}

/** Batched signed URLs for a private bucket; refetches before the URLs expire. */
export function useSignedUrls(bucket: AppBucket, paths: string[]) {
  const key = [...paths].sort();
  return useQuery({
    queryKey: ['signed-urls', bucket, key],
    queryFn: () => createSignedUrls(bucket, key),
    enabled: key.length > 0,
    staleTime: (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000,
  });
}
