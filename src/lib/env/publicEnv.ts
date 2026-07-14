import Constants from 'expo-constants';

type PublicEnvKey = 'EXPO_PUBLIC_API_URL' | 'EXPO_PUBLIC_CHAT_URL' | 'EXPO_PUBLIC_MOBILE_APP_SECRET';

const EXTRA_KEY: Record<PublicEnvKey, 'apiUrl' | 'chatUrl' | 'mobileAppSecret'> = {
  EXPO_PUBLIC_API_URL: 'apiUrl',
  EXPO_PUBLIC_CHAT_URL: 'chatUrl',
  EXPO_PUBLIC_MOBILE_APP_SECRET: 'mobileAppSecret',
};

/** Read EXPO_PUBLIC_* from Metro-inlined env or app.config `extra` (EAS release builds). */
export function readPublicEnv(name: PublicEnvKey): string | undefined {
  const fromProcess = process.env[name]?.trim();
  if (fromProcess) {
    return fromProcess;
  }

  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.[EXTRA_KEY[name]]?.trim();
  if (fromExtra) {
    return fromExtra;
  }

  return undefined;
}
