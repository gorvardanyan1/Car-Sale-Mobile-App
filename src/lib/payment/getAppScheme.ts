import * as Linking from 'expo-linking';

/** Expo Go uses `exp`; dev/production builds use app.json scheme. */
export function getAppScheme(): string {
  const rootUrl = Linking.createURL('/');
  const match = rootUrl.match(/^([a-z][a-z0-9+.-]*):/i);

  return match?.[1] ?? 'car-sale-rn';
}
