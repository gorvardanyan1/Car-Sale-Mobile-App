import Constants from 'expo-constants';

type PublicEnvKey =
  | 'EXPO_PUBLIC_API_URL'
  | 'EXPO_PUBLIC_CHAT_URL'
  | 'EXPO_PUBLIC_MOBILE_APP_SECRET'
  | 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'
  | 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID';

type ExtraKey =
  | 'apiUrl'
  | 'chatUrl'
  | 'mobileAppSecret'
  | 'googleIosClientId'
  | 'googleAndroidClientId'
  | 'googleWebClientId';

const EXTRA_KEY: Record<PublicEnvKey, ExtraKey> = {
  EXPO_PUBLIC_API_URL: 'apiUrl',
  EXPO_PUBLIC_CHAT_URL: 'chatUrl',
  EXPO_PUBLIC_MOBILE_APP_SECRET: 'mobileAppSecret',
  // Google OAuth *client IDs* only. These are public identifiers by design —
  // a native OAuth client has no secret, which is exactly why the PKCE flow
  // exists. Never add a client secret here: anything in EXPO_PUBLIC_* ships
  // inside the app bundle and can be read out of an APK or IPA.
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'googleIosClientId',
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'googleAndroidClientId',
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'googleWebClientId',
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
