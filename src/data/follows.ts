import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from './auth';
import { getSupabaseClient } from './client';
import { requireUserId } from './storage';

/** Does the signed-in user follow this user? */
export async function getIsFollowing(followeeId: string): Promise<boolean> {
  const client = getSupabaseClient();
  const followerId = await requireUserId();
  const { data, error } = await client
    .from('follows')
    .select('followee_id')
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function getFollowerCount(userId: string): Promise<number> {
  const client = getSupabaseClient();
  const { count, error } = await client
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('followee_id', userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function follow(followeeId: string): Promise<void> {
  const client = getSupabaseClient();
  const followerId = await requireUserId();
  const { error } = await client
    .from('follows')
    .insert({ follower_id: followerId, followee_id: followeeId });
  // 23505 = already following (PK hit) — the state we wanted, not an error.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unfollow(followeeId: string): Promise<void> {
  const client = getSupabaseClient();
  const followerId = await requireUserId();
  const { error } = await client
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('followee_id', followeeId);
  if (error) throw new Error(error.message);
}

/** Follow state for another user's profile — never queried for yourself. */
export function useIsFollowing(userId: string) {
  const { session } = useSession();
  return useQuery({
    queryKey: ['follows', 'is-following', userId],
    queryFn: () => getIsFollowing(userId),
    enabled: !!userId && !!session && userId !== session.user.id,
  });
}

export function useFollowerCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['follows', 'follower-count', userId],
    queryFn: () => getFollowerCount(userId!),
    enabled: !!userId,
  });
}

function useToggleFollow(mutationFn: (followeeId: string) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_data, followeeId) => {
      queryClient.invalidateQueries({ queryKey: ['follows', 'is-following', followeeId] });
      queryClient.invalidateQueries({ queryKey: ['follows', 'follower-count', followeeId] });
    },
  });
}

export const useFollow = () => useToggleFollow(follow);
export const useUnfollow = () => useToggleFollow(unfollow);
