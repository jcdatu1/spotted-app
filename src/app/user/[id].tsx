import { useLocalSearchParams } from 'expo-router';

import { useSession } from '@/data/auth';
import { AudienceProfileScreen } from '@/features/profile/audience-profile-screen';
import { ProfileScreen } from '@/features/profile/profile-screen';

/** Your own id gets the owner experience (edit, create, drafts) rather than
 *  a Follow-less audience page — reachable by tapping yourself in search. */
export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  if (session && id === session.user.id) return <ProfileScreen coversStatusBar={false} />;
  return <AudienceProfileScreen userId={id} />;
}
