import { Href, Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { GradientButton } from '@/components/ui/GradientButton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { firstFieldError, getErrorMessage, mapApiErrors } from '@/lib/api/errors';
import { colors, spacing, typography } from '@/theme';
import type { FieldErrors } from '@/types';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      const nextErrors: FieldErrors = {};
      if (!trimmedEmail) {
        nextErrors.email = t('mobile.errors.email_required');
      }
      if (!password) {
        nextErrors.password = t('mobile.errors.password_required');
      }
      setFieldErrors(nextErrors);
      setFormError(t('mobile.errors.sign_in_required'));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signIn({ email: trimmedEmail, password });
    } catch (error) {
      setFieldErrors(mapApiErrors(error));
      setFormError(getErrorMessage(error, t('mobile.errors.sign_in_failed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.sign_in_to_account')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.or')}{' '}
          <Link href={'/(auth)/register' as Href} style={styles.link}>
            {t('auth.create_new_account')}
          </Link>
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label={t('auth.email_address')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          editable={!isSubmitting}
          error={firstFieldError(fieldErrors, 'email')}
        />

        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void handleSubmit()}
          editable={!isSubmitting}
          error={firstFieldError(fieldErrors, 'password')}
        />

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <GradientButton
          label={isSubmitting ? t('mobile.auth.signing_in') : t('auth.sign_in')}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          style={styles.submitButton}
        />

        {isSubmitting ? (
          <ActivityIndicator color={colors.primaryLight} style={styles.loader} />
        ) : null}
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  link: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  form: {
    gap: spacing.md,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.sm,
  },
});
