import { useLocalSearchParams } from 'expo-router';

import { CreateAnnouncementWizard } from '@/components/create-announcement/CreateAnnouncementWizard';

export default function EditAnnouncementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const announcementId = Number(id);

  if (!Number.isFinite(announcementId) || announcementId <= 0) {
    return null;
  }

  return <CreateAnnouncementWizard announcementId={announcementId} />;
}
