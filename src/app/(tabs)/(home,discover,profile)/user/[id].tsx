import { Stack, useLocalSearchParams } from 'expo-router';

import { useSession } from '@/data/auth';
import { AudienceProfileScreen } from '@/features/profile/audience-profile-screen';
import { ProfileScreen } from '@/features/profile/profile-screen';
import { pushedHeader } from '@/theme/navigation';

/** Your own id gets the owner experience (edit, create, drafts) rather than
 *  a Follow-less audience page — reachable by tapping yourself in search. */
export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  return (
    <>
      <Stack.Screen options={{ ...pushedHeader, headerTitle: '' }} />
      {session && id === session.user.id ? (
        <ProfileScreen coversStatusBar={false} />
      ) : (
        <AudienceProfileScreen userId={id} />
      )}
    </>
  );
}
