import Constants from 'expo-constants';

/** True when the app runs inside the Expo Go client. */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/**
 * Remote push via expo-notifications is not available in Expo Go (SDK 53+).
 * Development or production builds are required for device push.
 */
export function isRemotePushSupported(): boolean {
  return !isExpoGo();
}

export function shouldShowExpoGoPushBanner(): boolean {
  return !isRemotePushSupported();
}
