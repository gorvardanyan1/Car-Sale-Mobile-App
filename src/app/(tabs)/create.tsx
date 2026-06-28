import { Camera } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { colors, radii, spacing, typography } from '@/theme';

const STEP_LABEL_KEYS = [
  'mobile.create.step_details',
  'mobile.create.step_specs',
  'mobile.create.step_photos',
] as const;

const STEP_FIELD_KEYS = [
  ['filters.brand', 'filters.model', 'announcement.year', 'announcement.price', 'announcement.mileage', 'announcement.location'],
  ['announcement.fuel_type', 'announcement.transmission', 'filters.drive_type'],
  [],
] as const;

export default function CreateScreen() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const currentStepLabelKey = STEP_LABEL_KEYS[step - 1];
  const currentFields = useMemo(() => STEP_FIELD_KEYS[step - 1].map((key) => t(key)), [step, t]);

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={t('mobile.create.title')}
        subtitle={t('mobile.create.step', { step, label: t(currentStepLabelKey) })}
      />

      <View style={styles.progressRow}>
        {STEP_LABEL_KEYS.map((_, index) => (
          <View
            key={index}
            style={[styles.progressSegment, index < step && styles.progressSegmentActive]}
          />
        ))}
      </View>

      {step < 3 ? (
        <View style={styles.form}>
          {currentFields.map((field) => (
            <View key={field}>
              <Text style={styles.label}>{field}</Text>
              <TextInput
                placeholder={field}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.input}
              />
            </View>
          ))}
        </View>
      ) : (
        <Pressable style={styles.photoDropzone}>
          <Camera color={colors.textSubtle} size={32} />
          <Text style={styles.photoTitle}>{t('mobile.create.add_photos')}</Text>
          <Text style={styles.photoSubtitle}>{t('mobile.create.add_photos_hint')}</Text>
        </Pressable>
      )}

      <View style={styles.actions}>
        {step > 1 ? (
          <Pressable onPress={() => setStep((value) => value - 1)} style={styles.backButton}>
            <Text style={styles.backButtonText}>{t('mobile.create.back')}</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <GradientButton
          label={step === 3 ? t('mobile.create.publish') : t('mobile.create.continue')}
          onPress={() => setStep((value) => Math.min(value + 1, 3))}
          style={styles.continueButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    ...typography.body,
  },
  photoDropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radii.card,
    backgroundColor: colors.surfaceMuted,
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  photoTitle: {
    ...typography.sectionTitle,
    color: colors.textSecondary,
  },
  photoSubtitle: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
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
