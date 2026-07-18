import { useLocalSearchParams } from 'expo-router';

import { AudienceProfileScreen } from '@/features/profile/audience-profile-screen';

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AudienceProfileScreen userId={id} />;
}
