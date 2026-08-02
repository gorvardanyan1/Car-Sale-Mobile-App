import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Globe, Link as LinkIcon, MapPin, Phone, Plus, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { GradientButton } from '@/components/ui/GradientButton';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { TextField } from '@/components/ui/TextField';
import { DealerVerificationBadge } from '@/components/dealers/DealerVerificationBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useDealerAccount } from '@/hooks/useDealerAccount';
import { useSuccessToast } from '@/hooks/useSuccessToast';
import { firstFieldError, getErrorMessage, mapApiErrors } from '@/lib/api/errors';
import { getDealerCoverUrl, getDealerLogoUrl } from '@/lib/dealers/dealerDisplay';
import { pickAnnouncementImages } from '@/lib/announcements/pickAnnouncementImages';
import {
  updateDealerProfile,
  uploadDealerCover,
  uploadDealerLogo,
} from '@/services/dealerAccountService';
import type { DealerBusinessHour } from '@/types/dealer';
import type { FieldErrors } from '@/types';
import { colors, gradients, radii, spacing, typography } from '@/theme';

export default function DealerProfileScreen() {
  const { t } = useTranslation();
  const { refreshUser } = useAuth();
  const { account, loading, error, refresh, setAccount } = useDealerAccount();
  const successToast = useSuccessToast();

  const [companyName, setCompanyName] = useState('');
  const [aboutUs, setAboutUs] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [businessHours, setBusinessHours] = useState<DealerBusinessHour[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [newSpecialization, setNewSpecialization] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Adjust state during render (React's recommended pattern for deriving
  // local editable state from a prop the first time it arrives) instead of
  // an effect — avoids the extra render an effect-based hydration would cost
  // and the state-in-effect lint rule that pattern trips. Gated by a flag
  // rather than object identity: `account` gets a new reference on every
  // logo/cover upload and save (see setAccount calls below), and those must
  // never re-run this block or they'd stomp whatever the user is mid-typing.
  const [hydrated, setHydrated] = useState(false);

  if (account && !hydrated) {
    setCompanyName(account.user.name ?? '');
    setAboutUs(account.profile?.about_us ?? '');
    setPhone(account.profile?.phone ?? '');
    setWebsite(account.profile?.website ?? '');
    setLocation(account.profile?.location ?? '');
    setFacebookUrl(account.profile?.facebook_url ?? '');
    setTwitterUrl(account.profile?.twitter_url ?? '');
    setInstagramUrl(account.profile?.instagram_url ?? '');
    setBusinessHours(account.profile?.business_hours ?? []);
    setSpecializations(account.profile?.specializations ?? []);
    setHydrated(true);
  }

  const logoUrl = useMemo(() => getDealerLogoUrl(account?.profile?.logo), [account?.profile?.logo]);
  const coverUrl = useMemo(
    () => getDealerCoverUrl(account?.profile?.feature_image),
    [account?.profile?.feature_image],
  );

  async function handleUploadLogo() {
    const [image] = await pickAnnouncementImages({ multiple: false });
    if (!image) {
      return;
    }

    setIsUploadingLogo(true);
    try {
      const url = await uploadDealerLogo(image);
      setAccount((prev) => (prev ? { ...prev, profile: { ...(prev.profile ?? emptyProfile()), logo: url } } : prev));
    } catch (err) {
      Alert.alert(t('mobile.errors.update_profile_failed'), getErrorMessage(err));
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function handleUploadCover() {
    const [image] = await pickAnnouncementImages({ multiple: false });
    if (!image) {
      return;
    }

    setIsUploadingCover(true);
    try {
      const url = await uploadDealerCover(image);
      setAccount((prev) =>
        prev ? { ...prev, profile: { ...(prev.profile ?? emptyProfile()), feature_image: url } } : prev,
      );
    } catch (err) {
      Alert.alert(t('mobile.errors.update_profile_failed'), getErrorMessage(err));
    } finally {
      setIsUploadingCover(false);
    }
  }

  function addBusinessHour() {
    setBusinessHours((prev) => [...prev, { day: '', hours: '' }]);
  }

  function updateBusinessHour(index: number, patch: Partial<DealerBusinessHour>) {
    setBusinessHours((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removeBusinessHour(index: number) {
    setBusinessHours((prev) => prev.filter((_, i) => i !== index));
  }

  function addSpecialization() {
    const value = newSpecialization.trim();
    if (!value || specializations.includes(value)) {
      setNewSpecialization('');
      return;
    }

    setSpecializations((prev) => [...prev, value]);
    setNewSpecialization('');
  }

  function removeSpecialization(value: string) {
    setSpecializations((prev) => prev.filter((item) => item !== value));
  }

  async function handleSave() {
    setFieldErrors({});
    setFormError(null);

    if (!companyName.trim()) {
      setFieldErrors({ name: t('mobile.errors.name_required') });
      return;
    }

    setIsSaving(true);

    try {
      const result = await updateDealerProfile({
        name: companyName.trim(),
        about_us: aboutUs.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        facebook_url: facebookUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        location: location.trim() || null,
        business_hours: businessHours.filter((row) => row.day.trim() && row.hours.trim()),
        specializations,
      });

      setAccount((prev) => (prev ? { ...prev, user: result.user, profile: result.profile } : prev));
      await refreshUser();

      successToast.show(t('mobile.profile.saved'));
    } catch (err) {
      setFieldErrors(mapApiErrors(err));
      setFormError(getErrorMessage(err, t('mobile.errors.update_profile_failed')));
    } finally {
      setIsSaving(false);
    }
  }

  if (loading && !account) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('dealer.edit_profile')} showBack backFallback="/(tabs)/settings" />
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (error && !account) {
    return (
      <ScreenContainer>
        <ScreenHeader title={t('dealer.edit_profile')} showBack backFallback="/(tabs)/settings" />
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void refresh()}>
            <Text style={styles.retryText}>{t('mobile.list.retry')}</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <SuccessToast
        visible={successToast.visible}
        message={successToast.message}
        onHide={successToast.hide}
      />
      <ScreenContainer scrollable>
        <ScreenHeader
          title={t('dealer.edit_profile')}
          subtitle={t('dealer.edit_profile_subtitle')}
          showBack
          backFallback="/(tabs)/settings"
        />

      <View style={styles.verificationRow}>
        <DealerVerificationBadge
          isVerified={account?.is_dealer_verified ?? false}
          priceCents={account?.dealer_verification_price_cents ?? 0}
          featureAccess={account?.dealer_badge_feature_access ?? null}
          onVerified={() => void refresh()}
        />
      </View>

      <Pressable onPress={() => void handleUploadCover()} style={styles.coverWrap}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[...gradients.primary]} style={styles.cover} />
        )}
        <View style={styles.coverOverlay}>
          {isUploadingCover ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Camera color={colors.white} size={20} />
              <Text style={styles.coverOverlayText}>{t('dealer.cover_image')}</Text>
            </>
          )}
        </View>
      </Pressable>

      <Pressable onPress={() => void handleUploadLogo()} style={styles.logoWrap}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Camera color={colors.textMuted} size={22} />
          </View>
        )}
        <View style={styles.logoBadge}>
          {isUploadingLogo ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Camera color={colors.white} size={12} />
          )}
        </View>
      </Pressable>
      <Text style={styles.logoHint}>{t('dealer.add_logo_hint')}</Text>

      <View style={styles.form}>
        <TextField
          label={t('auth.company_name')}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
          error={firstFieldError(fieldErrors, 'name')}
          required
        />

        <TextField
          label={t('dealer.about_us')}
          value={aboutUs}
          onChangeText={setAboutUs}
          multiline
          numberOfLines={4}
          style={styles.textArea}
          error={firstFieldError(fieldErrors, 'about_us')}
        />

        <View style={styles.row}>
          <View style={styles.rowField}>
            <TextField
              label={t('dealer.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              rightSlot={<Phone color={colors.textSubtle} size={16} />}
              error={firstFieldError(fieldErrors, 'phone')}
            />
          </View>
          <View style={styles.rowField}>
            <TextField
              label={t('dealer.website')}
              value={website}
              onChangeText={setWebsite}
              autoCapitalize="none"
              keyboardType="url"
              rightSlot={<Globe color={colors.textSubtle} size={16} />}
              error={firstFieldError(fieldErrors, 'website')}
            />
          </View>
        </View>

        <TextField
          label={t('dealer.location')}
          value={location}
          onChangeText={setLocation}
          rightSlot={<MapPin color={colors.textSubtle} size={16} />}
          error={firstFieldError(fieldErrors, 'location')}
        />

        <Text style={styles.sectionLabel}>{t('dealer.social')}</Text>
        <TextField
          label={t('dealer.facebook')}
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          autoCapitalize="none"
          keyboardType="url"
          rightSlot={<LinkIcon color={colors.textSubtle} size={16} />}
          error={firstFieldError(fieldErrors, 'facebook_url')}
        />
        <TextField
          label={t('dealer.twitter')}
          value={twitterUrl}
          onChangeText={setTwitterUrl}
          autoCapitalize="none"
          keyboardType="url"
          rightSlot={<LinkIcon color={colors.textSubtle} size={16} />}
          error={firstFieldError(fieldErrors, 'twitter_url')}
        />
        <TextField
          label={t('dealer.instagram')}
          value={instagramUrl}
          onChangeText={setInstagramUrl}
          autoCapitalize="none"
          keyboardType="url"
          rightSlot={<LinkIcon color={colors.textSubtle} size={16} />}
          error={firstFieldError(fieldErrors, 'instagram_url')}
        />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>{t('dealer.business_hours')}</Text>
          <Pressable onPress={addBusinessHour} hitSlop={8} style={styles.addRowButton}>
            <Plus color={colors.primaryLight} size={16} />
          </Pressable>
        </View>

        {businessHours.map((row, index) => (
          <View key={`hours-${index}`} style={styles.hourRow}>
            <View style={styles.hourField}>
              <TextField
                label={t('dealer.day')}
                value={row.day}
                onChangeText={(value) => updateBusinessHour(index, { day: value })}
                showOptionalHint={false}
              />
            </View>
            <View style={styles.hourField}>
              <TextField
                label={t('dealer.hours')}
                value={row.hours}
                onChangeText={(value) => updateBusinessHour(index, { hours: value })}
                showOptionalHint={false}
              />
            </View>
            <Pressable onPress={() => removeBusinessHour(index)} hitSlop={8} style={styles.removeRowButton}>
              <Trash2 color={colors.error} size={16} />
            </Pressable>
          </View>
        ))}

        <Text style={styles.sectionLabel}>{t('dealer.specializations')}</Text>
        <View style={styles.chipsRow}>
          {specializations.map((item) => (
            <Pressable key={item} onPress={() => removeSpecialization(item)} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Text style={styles.chipRemove}>×</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.addChipRow}>
          <View style={styles.addChipInput}>
            <TextField
              label={t('dealer.add_specialization')}
              value={newSpecialization}
              onChangeText={setNewSpecialization}
              onSubmitEditing={addSpecialization}
              showOptionalHint={false}
            />
          </View>
          <Pressable onPress={addSpecialization} style={styles.addChipButton} hitSlop={8}>
            <Plus color={colors.white} size={18} />
          </Pressable>
        </View>

        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <GradientButton
          label={isSaving ? t('mobile.profile.saving') : t('profile.save_changes')}
          onPress={() => void handleSave()}
          disabled={isSaving}
        />
      </View>
      </ScreenContainer>
    </>
  );
}

function emptyProfile() {
  return {
    about_us: null,
    phone: null,
    website: null,
    facebook_url: null,
    twitter_url: null,
    instagram_url: null,
    location: null,
    business_hours: [],
    specializations: [],
    logo: null,
    feature_image: null,
  };
}

const styles = StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  verificationRow: {
    marginBottom: spacing.md,
  },
  coverWrap: {
    height: 140,
    borderRadius: radii.xl,
    overflow: 'hidden',
    marginBottom: -40,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  coverOverlayText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
  logoWrap: {
    marginLeft: spacing.md,
    width: 80,
    height: 80,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: colors.surfaceMuted,
  },
  logoFallback: {
    width: 80,
    height: 80,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: colors.background,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  logoHint: {
    ...typography.caption,
    color: colors.textSubtle,
    marginLeft: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  form: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowField: {
    flex: 1,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  addRowButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  hourField: {
    flex: 1,
  },
  removeRowButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.errorMuted,
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipRemove: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  addChipRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  addChipInput: {
    flex: 1,
  },
  addChipButton: {
    width: 44,
    height: 44,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  formError: {
    ...typography.caption,
    color: colors.error,
  },
});
