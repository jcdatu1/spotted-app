import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { PreparedImage } from '@/lib/images';

import { useSession } from './auth';
import { getSupabaseClient } from './client';
import { publicUrl, removeObjects, requireUserId, uniqueObjectName, uploadImage } from './storage';
import type { Tables } from './types';

const BUCKET = 'profile-media';

export type Profile = Tables<'profiles'>;

/** The owner's view: profile row plus the owner-private birthday. */
export type MyProfile = Profile & { birthday: string | null };

export type ProfilePatch = {
  display_name?: string;
  bio?: string | null;
  birthday?: string | null;
};

/** Stable public URL for an avatar/cover path (null-safe passthrough). */
export function profileMediaUrl(path: string | null): string | null {
  return path ? publicUrl(BUCKET, path) : null;
}

export async function getMyProfile(): Promise<MyProfile> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const [profileRes, privateRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).single(),
    client.from('private_profiles').select('birthday').eq('id', userId).maybeSingle(),
  ]);
  if (profileRes.error) throw new Error(profileRes.error.message);
  if (privateRes.error) throw new Error(privateRes.error.message);
  return { ...profileRes.data, birthday: privateRes.data?.birthday ?? null };
}

export async function updateMyProfile(patch: ProfilePatch): Promise<void> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const { birthday, ...profileFields } = patch;

  if (Object.keys(profileFields).length > 0) {
    const { error } = await client.from('profiles').update(profileFields).eq('id', userId);
    if (error) throw new Error(error.message);
  }
  if (birthday !== undefined) {
    const { error } = await client.from('private_profiles').update({ birthday }).eq('id', userId);
    if (error) throw new Error(error.message);
  }
}

/**
 * Media replace lifecycle: upload under a fresh unique name, point the row at
 * it, then best-effort delete the predecessor. The row never references a
 * path that was not successfully uploaded.
 */
async function setProfileImage(kind: 'avatar' | 'cover', image: PreparedImage): Promise<void> {
  const client = getSupabaseClient();
  const userId = await requireUserId();
  const column = kind === 'avatar' ? 'avatar_path' : 'cover_path';

  const { data: current, error: readError } = await client
    .from('profiles')
    .select('avatar_path, cover_path')
    .eq('id', userId)
    .single();
  if (readError) throw new Error(readError.message);
  const previousPath = current[column];

  const path = `${userId}/${uniqueObjectName(kind, image.extension)}`;
  await uploadImage(BUCKET, path, image);

  const patch = kind === 'avatar' ? { avatar_path: path } : { cover_path: path };
  const { error } = await client.from('profiles').update(patch).eq('id', userId);
  if (error) {
    await removeObjects(BUCKET, [path]).catch(() => {});
    throw new Error(error.message);
  }
  if (previousPath) await removeObjects(BUCKET, [previousPath]).catch(() => {});
}

export const setMyAvatar = (image: PreparedImage) => setProfileImage('avatar', image);
export const setMyCover = (image: PreparedImage) => setProfileImage('cover', image);

/** Callable while signed out (security-definer RPC) — used by the sign-up form pre-check. */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('username_available', { name: username.trim() });
  if (error) throw new Error(error.message);
  return data;
}

/** Any user's public profile row (profiles are app-wide readable). */
export async function getProfileById(id: string): Promise<Profile | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('profiles').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: ['profiles', 'detail', id],
    queryFn: () => getProfileById(id),
    enabled: !!id,
  });
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
