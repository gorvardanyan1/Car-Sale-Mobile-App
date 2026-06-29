import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { firstFieldError, getErrorMessage, mapApiErrors } from '@/lib/api/errors';
import { validateEditProfile } from '@/lib/profile/validateProfile';
import { updateProfile } from '@/services/profileService';
import type { FieldErrors } from '@/types';
import { colors, spacing, typography } from '@/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const isDealer = user?.roles.includes('dealer') ?? false;

  const [name, setName] = useState(user?.name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailVerified = useMemo(
    () => user?.email_verified_at != null && user.email === email.trim(),
    [email, user?.email, user?.email_verified_at],
  );

  if (!user) {
    return null;
  }

  async function handleSubmit() {
    setFieldErrors({});
    setFormError(null);

    const validation = validateEditProfile({ name, email }, t);
    if (!validation.ok) {
      setFieldErrors({ [validation.field]: validation.message });
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        name: name.trim(),
        last_name: isDealer ? null : lastName.trim() || null,
        email: email.trim(),
      });
      await refreshUser();
      Alert.alert(t('profile.save_changes'), t('mobile.profile.saved'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (error) {
      setFieldErrors(mapApiErrors(error));
      setFormError(getErrorMessage(error, t('mobile.errors.update_profile_failed')));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={t('mobile.settings.edit_profile')}
        subtitle={t('profile.edit_account')}
        showBack
        backFallback="/(tabs)/settings"
      />

      <View style={styles.form}>
        {isDealer ? (
          <TextField
            label={t('auth.company_name')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            error={firstFieldError(fieldErrors, 'name')}
            required
          />
        ) : (
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <TextField
                label={t('auth.first_name')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="given-name"
                error={firstFieldError(fieldErrors, 'name')}
                required
              />
            </View>
            <View style={styles.nameField}>
              <TextField
                label={t('auth.last_name')}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                autoComplete="family-name"
                error={firstFieldError(fieldErrors, 'last_name')}
              />
            </View>
          </View>
        )}

        <TextField
          label={t('auth.email_address')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          error={firstFieldError(fieldErrors, 'email')}
          required
        />

        {!emailVerified ? (
          <Text style={styles.verifyHint}>{t('mobile.profile.email_unverified_hint')}</Text>
        ) : null}

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <GradientButton
          label={isSubmitting ? t('mobile.profile.saving') : t('profile.save_changes')}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  verifyHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
  },
});
