import type { UserLocation } from '@/types/announcement';

/**
 * Request device location for nearest sort.
 * Uses dynamic import so tests and web builds without expo-location still work.
 */
export async function getDeviceLocation(): Promise<UserLocation> {
  try {
    const Location = await import('expo-location');

    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    throw new Error('Location permission denied');
  }
}
