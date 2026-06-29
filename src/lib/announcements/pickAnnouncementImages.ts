import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from '@/types/announcement';

function toPickedImage(asset: ImagePicker.ImagePickerAsset): PickedImage {
  const name = asset.fileName ?? asset.uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
  const type = asset.mimeType ?? 'image/jpeg';

  return {
    uri: asset.uri,
    name,
    type,
  };
}

export async function requestMediaLibraryPermission(): Promise<boolean> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return result.granted;
}

export async function pickAnnouncementImages(options: {
  multiple?: boolean;
  limit?: number;
} = {}): Promise<PickedImage[]> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) {
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: options.multiple ?? false,
    selectionLimit: options.limit ?? 1,
    quality: 0.65,
  });

  if (result.canceled || result.assets.length === 0) {
    return [];
  }

  return result.assets.map(toPickedImage);
}
