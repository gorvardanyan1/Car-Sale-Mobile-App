import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { firstFieldError, getErrorMessage, mapApiErrors } from '@/lib/api/errors';
import { validateChangePassword } from '@/lib/profile/validateProfile';
import { changePassword } from '@/services/profileService';
import type { FieldErrors } from '@/types';
import { colors, spacing, typography } from '@/theme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return null;
  }

  async function handleSubmit() {
    setFieldErrors({});
    setFormError(null);

    const validation = validateChangePassword(
      {
        old_password: oldPassword,
        password,
        password_confirmation: passwordConfirmation,
      },
      t,
    );

    if (!validation.ok) {
      setFieldErrors({ [validation.field]: validation.message });
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword({
        name: user.name,
        email: user.email,
        old_password: oldPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      await signOut();

      Alert.alert(t('profile.change_password'), t('mobile.profile.password_changed_relogin'), [
        {
          text: t('auth.sign_in'),
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (error) {
      setFieldErrors(mapApiErrors(error));
      setFormError(getErrorMessage(error, t('mobile.errors.change_password_failed')));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer scrollable padded>
      <ScreenHeader
        title={t('mobile.settings.change_password')}
        subtitle={t('mobile.profile.change_password_description')}
        showBack
        backFallback="/(tabs)/settings"
      />

      <View style={styles.form}>
        <TextField
          label={t('profile.old_password')}
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry
          secureToggle
          autoComplete="current-password"
          textContentType="password"
          error={firstFieldError(fieldErrors, 'old_password')}
          required
          showOptionalHint={false}
        />

        <TextField
          label={t('profile.new_password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          error={firstFieldError(fieldErrors, 'password')}
          required
          showOptionalHint={false}
        />

        <TextField
          label={t('profile.confirm_password')}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          error={firstFieldError(fieldErrors, 'password_confirmation')}
          required
          showOptionalHint={false}
        />

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
  formError: {
    ...typography.caption,
    color: colors.error,
  },
});
