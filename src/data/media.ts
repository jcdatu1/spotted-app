import type { PreparedImage } from '@/lib/images';

import { requireUserId, uniqueObjectName, uploadImage, useSignedUrls } from './storage';

const BUCKET = 'trip-media';

/**
 * Uploads a prepared image to the caller's own prefix ({uid}/{tripId}/...) in
 * the private trip-media bucket and returns the storage path. Throws on
 * failure — callers must not create a photo update row unless this succeeds.
 */
export async function uploadTripPhoto(tripId: string, image: PreparedImage): Promise<string> {
  const userId = await requireUserId();
  const path = `${userId}/${tripId}/${uniqueObjectName('photo', image.extension)}`;
  return uploadImage(BUCKET, path, image);
}

/** Batched signed URLs for a thread's photos; refetches before the URLs expire. */
export function useSignedPhotoUrls(paths: string[]) {
  return useSignedUrls(BUCKET, paths);
}
