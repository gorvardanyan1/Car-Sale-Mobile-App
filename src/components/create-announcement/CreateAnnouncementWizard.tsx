import { Car, Image as ImageIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CreateAnnouncementStepDetails } from '@/components/create-announcement/CreateAnnouncementStepDetails';
import { CreateAnnouncementStepPhotos } from '@/components/create-announcement/CreateAnnouncementStepPhotos';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCreateAnnouncement } from '@/hooks/useCreateAnnouncement';
import { colors, radii, spacing, typography } from '@/theme';

export function CreateAnnouncementWizard({ announcementId }: { announcementId?: number } = {}) {
  const { t } = useTranslation();
  const wizard = useCreateAnnouncement(announcementId);
  const isEdit = wizard.isEdit;

  const steps = useMemo(
    () => [
      { number: 1, title: t('announcement.step_vehicle_details'), icon: Car },
      { number: 2, title: t('announcement.step_photos_description'), icon: ImageIcon },
    ],
    [t],
  );

  const currentStep = steps[wizard.step - 1];

  if (wizard.loadingConfig) {
    return (
      <ScreenContainer padded>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>{t('mobile.create.loading_config')}</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={isEdit ? t('announcement.edit') : t('mobile.create.title')}
        subtitle={
          isEdit
            ? t('announcement.edit_subtitle')
            : t('mobile.create.step', {
                step: wizard.step,
                label: currentStep?.title ?? '',
              })
        }
        showBack={isEdit}
        backFallback="/settings/my-announcements"
      />

      <View style={styles.progressRow}>
        {steps.map((step) => (
          <View
            key={step.number}
            style={[styles.progressSegment, wizard.step >= step.number && styles.progressSegmentActive]}
          />
        ))}
      </View>

      {wizard.error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{wizard.error}</Text>
          <Pressable onPress={() => wizard.setError(null)}>
            <Text style={styles.dismissText}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      ) : null}

      {wizard.step === 1 ? <CreateAnnouncementStepDetails wizard={wizard} /> : null}
      {wizard.step === 2 ? <CreateAnnouncementStepPhotos wizard={wizard} /> : null}

      <View style={styles.actions}>
        {wizard.step > 1 ? (
          <Pressable onPress={wizard.goBack} style={styles.backButton} disabled={wizard.submitting}>
            <Text style={styles.backButtonText}>{t('mobile.create.back')}</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <GradientButton
          label={
            wizard.submitting
              ? isEdit
                ? t('mobile.edit.updating')
                : t('mobile.create.publishing')
              : wizard.step === 2
                ? isEdit
                  ? t('announcement.update')
                  : t('announcement.publish')
                : t('mobile.create.continue')
          }
          onPress={() => {
            if (wizard.step === 1) {
              wizard.goNext();
              return;
            }

            void wizard.submit();
          }}
          disabled={wizard.submitting}
          style={styles.continueButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.lg,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  progressSegmentActive: {
    backgroundColor: colors.primary,
  },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.errorMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
  dismissText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  backButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  backButtonText: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    fontSize: 14,
  },
  backSpacer: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
});
