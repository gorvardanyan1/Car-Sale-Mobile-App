import { Camera, Sparkles, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { TextField } from '@/components/ui/TextField';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { MAX_ADDITIONAL_IMAGES } from '@/constants/createAnnouncement';
import type { useCreateAnnouncement } from '@/hooks/useCreateAnnouncement';
import { resolveStorageImageUrl } from '@/lib/announcements/formatAnnouncement';
import { pickAnnouncementImages } from '@/lib/announcements/pickAnnouncementImages';
import type { PickedImage } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type CreateAnnouncementStepPhotosProps = {
  wizard: ReturnType<typeof useCreateAnnouncement>;
};

export function CreateAnnouncementStepPhotos({ wizard }: CreateAnnouncementStepPhotosProps) {
  const { t } = useTranslation();
  const {
    form,
    updateForm,
    updateTranslation,
    generatingDescription,
    runGenerateDescription,
    translating,
    runTranslate,
  } = wizard;
  const mainPreviewUri =
    form.mainImage?.uri ??
    (form.existingMainImagePath ? resolveStorageImageUrl(form.existingMainImagePath) : null);
  const totalAdditionalCount = form.existingAdditionalImagePaths.length + form.additionalImages.length;

  async function pickMainImage() {
    const images = await pickAnnouncementImages({ multiple: false, limit: 1 });
    if (images[0]) {
      updateForm({ mainImage: images[0], existingMainImagePath: null });
    }
  }

  async function pickAdditionalImages() {
    const remaining = MAX_ADDITIONAL_IMAGES - totalAdditionalCount;
    if (remaining <= 0) {
      return;
    }

    const images = await pickAnnouncementImages({ multiple: true, limit: remaining });
    if (images.length > 0) {
      updateForm({ additionalImages: [...form.additionalImages, ...images] });
    }
  }

  function removeAdditionalImage(index: number) {
    updateForm({
      additionalImages: form.additionalImages.filter((_image: PickedImage, itemIndex: number) => itemIndex !== index),
    });
  }

  function removeExistingAdditionalImage(index: number) {
    updateForm({
      existingAdditionalImagePaths: form.existingAdditionalImagePaths.filter(
        (_path, itemIndex) => itemIndex !== index,
      ),
    });
  }

  function clearMainImage() {
    updateForm({ mainImage: null, existingMainImagePath: null });
  }

  return (
    <View style={styles.form}>
      <FieldLabel label={t('announcement.main_image')} required showOptionalHint={false} />
      <Pressable onPress={() => void pickMainImage()} style={styles.photoDropzone}>
        {mainPreviewUri ? (
          <View style={styles.mainPreviewWrap}>
            <Image source={{ uri: mainPreviewUri }} style={styles.mainPreview} resizeMode="cover" />
            <Pressable onPress={clearMainImage} style={styles.removeMain} accessibilityRole="button">
              <X color={colors.white} size={16} />
            </Pressable>
          </View>
        ) : (
          <>
            <Camera color={colors.textSubtle} size={32} />
            <Text style={styles.photoTitle}>{t('announcement.upload_main_photo')}</Text>
            <Text style={styles.photoSubtitle}>{t('announcement.main_image_hint')}</Text>
          </>
        )}
      </Pressable>

      <FieldLabel label={t('announcement.additional_images')} />
      <Pressable onPress={() => void pickAdditionalImages()} style={styles.addMoreButton}>
        <Text style={styles.addMoreText}>{t('mobile.create.choose_photos')}</Text>
        <Text style={styles.photoSubtitle}>{t('announcement.additional_images_hint')}</Text>
      </Pressable>

      {totalAdditionalCount > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbRow}>
          {form.existingAdditionalImagePaths.map((path, index) => (
            <View key={`existing-${path}-${index}`} style={styles.thumbWrap}>
              <Image
                source={{ uri: resolveStorageImageUrl(path) }}
                style={styles.thumb}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => removeExistingAdditionalImage(index)}
                style={styles.removeThumb}
                accessibilityRole="button"
              >
                <X color={colors.white} size={14} />
              </Pressable>
            </View>
          ))}
          {form.additionalImages.map((image: PickedImage, index: number) => (
            <View key={`${image.uri}-${index}`} style={styles.thumbWrap}>
              <Image source={{ uri: image.uri }} style={styles.thumb} resizeMode="cover" />
              <Pressable
                onPress={() => removeAdditionalImage(index)}
                style={styles.removeThumb}
                accessibilityRole="button"
              >
                <X color={colors.white} size={14} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.descriptionHeader}>
        <Pressable
          onPress={() => void runGenerateDescription()}
          disabled={generatingDescription}
          style={styles.aiButton}
        >
          {generatingDescription ? (
            <ActivityIndicator color={colors.primaryLight} size="small" />
          ) : (
            <>
              <Sparkles color={colors.primaryLight} size={14} />
              <Text style={styles.aiButtonText}>{t('announcement.generate_ai')}</Text>
            </>
          )}
        </Pressable>
      </View>

      <TextField
        label={t('announcement.description')}
        value={form.description}
        onChangeText={(value) => updateForm({ description: value })}
        multiline
        numberOfLines={6}
        style={styles.descriptionInput}
        textAlignVertical="top"
        required
      />

      <View style={styles.translationsToggleRow}>
        <View style={styles.translationsToggleText}>
          <Text style={styles.translationsToggleTitle}>{t('announcement.enable_translations')}</Text>
          <Text style={styles.translationsToggleHint}>{t('announcement.translations_hint')}</Text>
        </View>
        <Switch
          value={form.translationsEnabled}
          onValueChange={(value) => updateForm({ translationsEnabled: value })}
          trackColor={{ false: colors.border, true: colors.primary }}
        />
      </View>

      {form.translationsEnabled ? (
        <View style={styles.translationsBlock}>
          <Text style={styles.translationsHeading}>{t('announcement.translations')}</Text>

          <View style={styles.translationField}>
            <View style={styles.translationFieldHeader}>
              <Text style={styles.translationFieldLabel}>{t('mobile.settings.language_am')}</Text>
              <Pressable
                onPress={() => void runTranslate('am')}
                disabled={translating.am || !form.description.trim()}
                style={[
                  styles.translateButton,
                  (translating.am || !form.description.trim()) && styles.translateButtonDisabled,
                ]}
              >
                <Text style={styles.translateButtonText}>
                  {translating.am ? t('announcement.translating') : t('announcement.ai_translate')}
                </Text>
              </Pressable>
            </View>
            <TextField
              label=""
              value={form.translations.am}
              onChangeText={(value) => updateTranslation('am', value)}
              multiline
              numberOfLines={3}
              style={styles.translationInput}
              textAlignVertical="top"
              placeholder={t('announcement.enter_description_am')}
            />
          </View>

          <View style={styles.translationField}>
            <View style={styles.translationFieldHeader}>
              <Text style={styles.translationFieldLabel}>{t('mobile.settings.language_ru')}</Text>
              <Pressable
                onPress={() => void runTranslate('ru')}
                disabled={translating.ru || !form.description.trim()}
                style={[
                  styles.translateButton,
                  (translating.ru || !form.description.trim()) && styles.translateButtonDisabled,
                ]}
              >
                <Text style={styles.translateButtonText}>
                  {translating.ru ? t('announcement.translating') : t('announcement.ai_translate')}
                </Text>
              </Pressable>
            </View>
            <TextField
              label=""
              value={form.translations.ru}
              onChangeText={(value) => updateTranslation('ru', value)}
              multiline
              numberOfLines={3}
              style={styles.translationInput}
              textAlignVertical="top"
              placeholder={t('announcement.enter_description_ru')}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  photoDropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
    minHeight: 180,
    overflow: 'hidden',
    gap: spacing.sm,
    padding: spacing.md,
  },
  mainPreviewWrap: {
    width: '100%',
    position: 'relative',
  },
  mainPreview: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
  },
  removeMain: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTitle: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
    fontSize: 14,
  },
  photoSubtitle: {
    ...typography.caption,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  addMoreButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.button,
    padding: spacing.md,
    gap: 4,
    backgroundColor: colors.card,
  },
  addMoreText: {
    ...typography.body,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  thumbRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 88,
    height: 66,
    borderRadius: radii.md,
  },
  removeThumb: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 32,
  },
  aiButtonText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  descriptionInput: {
    minHeight: 140,
  },
  translationsToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  translationsToggleText: {
    flex: 1,
    gap: 2,
  },
  translationsToggleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  translationsToggleHint: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  translationsBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  translationsHeading: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 14,
  },
  translationField: {
    gap: spacing.xs,
  },
  translationFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  translationFieldLabel: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  translateButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  translateButtonDisabled: {
    opacity: 0.5,
  },
  translateButtonText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  translationInput: {
    minHeight: 80,
  },
});
