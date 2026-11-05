import { PermissionsAndroid, Platform } from 'react-native';
import { requestRecordingPermissionsAsync } from 'expo-audio';

/**
 * Asks for the microphone (and camera, for video) right before a call starts
 * — never at app launch — so a refusal is reported before anyone's phone
 * rings. On iOS the camera prompt comes from WebRTC itself when publishing
 * starts; the microphone is asked here so the common case fails fast.
 *
 * @returns null when granted, or 'permission_denied'
 */
export async function ensureCallPermissions(video: boolean): Promise<'permission_denied' | null> {
  if (Platform.OS === 'android') {
    const wanted = [
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ...(video ? [PermissionsAndroid.PERMISSIONS.CAMERA] : []),
    ];
    const result = await PermissionsAndroid.requestMultiple(wanted);
    const granted = wanted.every((p) => result[p] === PermissionsAndroid.RESULTS.GRANTED);
    return granted ? null : 'permission_denied';
  }

  const mic = await requestRecordingPermissionsAsync();
  return mic.granted ? null : 'permission_denied';
}
