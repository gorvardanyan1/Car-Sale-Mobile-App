import { Href, Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AccountTypeToggle } from '@/components/auth/AccountTypeToggle';
import { AuthScreenLayout } from '@/components/auth/AuthScreenLayout';
import { GradientButton } from '@/components/ui/GradientButton';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileAuthConfig } from '@/hooks/useMobileAuthConfig';
import { firstFieldError, getErrorMessage, mapApiErrors } from '@/lib/api/errors';
import { colors, spacing, typography } from '@/theme';
import type { AccountType, FieldErrors } from '@/types';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const { dealerAuthEnabled } = useMobileAuthConfig();
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccountTypeChange = (value: AccountType) => {
    setAccountType(value);
    setName('');
    setLastName('');
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setFormError(null);

    if (!acceptedTerms) {
      setFormError(t('mobile.errors.accept_terms'));
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp({
        account_type: dealerAuthEnabled ? accountType : 'user',
        name: name.trim(),
        last_name: accountType === 'user' ? lastName.trim() || undefined : undefined,
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
    } catch (error) {
      setFieldErrors(mapApiErrors(error));
      setFormError(getErrorMessage(error, t('mobile.errors.create_account_failed')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout>
      <View style={styles.header}>
        <Text style={styles.title}>{t('auth.create_account')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.already_have_account')}{' '}
          <Link href={'/(auth)/login' as Href} style={styles.link}>
            {t('auth.sign_in')}
          </Link>
        </Text>
      </View>

      <View style={styles.form}>
        {dealerAuthEnabled ? (
          <AccountTypeToggle value={accountType} onChange={handleAccountTypeChange} />
        ) : (
          <Text style={styles.dealerWebHint}>{t('mobile.auth.dealer_web_only')}</Text>
        )}

        {dealerAuthEnabled && accountType === 'dealer' ? (
          <TextField
            label={t('auth.company_name')}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            error={firstFieldError(fieldErrors, 'name')}
          />
        ) : (
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <TextField
                label={t('auth.first_name')}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                error={firstFieldError(fieldErrors, 'name')}
              />
            </View>
            <View style={styles.nameField}>
              <TextField
                label={t('auth.last_name')}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
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
        />

        <TextField
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          error={firstFieldError(fieldErrors, 'password')}
        />

        <TextField
          label={t('auth.confirm_password')}
          value={passwordConfirmation}
          onChangeText={setPasswordConfirmation}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          error={firstFieldError(fieldErrors, 'password_confirmation')}
        />

        <Pressable
          style={styles.termsRow}
          onPress={() => setAcceptedTerms((value) => !value)}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text style={styles.termsText}>
            {t('auth.i_agree_to')} {t('auth.terms_and_conditions')} {t('auth.and')}{' '}
            {t('auth.privacy_policy')}
          </Text>
        </Pressable>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <GradientButton
          label={isSubmitting ? t('mobile.auth.creating_account') : t('auth.create_account_button')}
          onPress={() => void handleSubmit()}
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
  dealerWebHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  nameField: {
    flex: 1,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  termsText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
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
