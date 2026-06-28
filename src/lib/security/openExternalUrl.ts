import { Linking } from 'react-native';

import { isSafeHttpUrl } from '@/lib/security/isSafeHttpUrl';

export async function openExternalUrl(url: string): Promise<boolean> {
  if (!isSafeHttpUrl(url)) {
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
