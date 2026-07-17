import { Bell, Trash2 } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ExpoGoPushBanner } from '@/components/notifications/ExpoGoPushBanner';
import { ConfirmActionModal } from '@/components/ui/ConfirmActionModal';
import { FeatureAccessBanner } from '@/components/wanted-searches/FeatureAccessBanner';
import { WantedMatchCard } from '@/components/wanted-searches/WantedMatchCard';
import { WantedSearchAlertCard } from '@/components/wanted-searches/WantedSearchAlertCard';
import { WantedSearchForm } from '@/components/wanted-searches/WantedSearchForm';
import { useWantedSearches } from '@/hooks/useWantedSearches';
import { getErrorMessage } from '@/lib/api/errors';
import { completeWantedSearchesCheckout } from '@/services/paymentService';
import type { WantedSearch } from '@/types/wantedSearch';
import { colors, spacing, typography } from '@/theme';

export default function WantedSearchesScreen() {
  const router = useRouter();
  const { paymentDone } = useLocalSearchParams<{ paymentDone?: string }>();
  const { t } = useTranslation();
  const wizard = useWantedSearches();
  const [isPaying, setIsPaying] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<WantedSearch | null>(null);

  useEffect(() => {
    if (paymentDone !== '1') {
      return;
    }

    setFormResetKey((value) => value + 1);
    void wizard.refresh();
    router.setParams({ paymentDone: undefined });
  }, [paymentDone, router, wizard.refresh]);

  const handlePay = useCallback(async () => {
    setIsPaying(true);

    try {
      const outcome = await completeWantedSearchesCheckout();

      if (outcome === 'fulfilled' || outcome === 'success') {
        setFormResetKey((value) => value + 1);
        await wizard.refresh();
      }
    } catch (error) {
      Alert.alert(
        t('payment_features.payment_required_title'),
        getErrorMessage(error, t('wanted_searches.payment_error')),
      );
    } finally {
      setIsPaying(false);
    }
  }, [t, wizard.refresh]);

  const confirmDelete = useCallback((search: WantedSearch) => {
    setDeleteTarget(search);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      void wizard.remove(deleteTarget.id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, wizard]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          title={t('user.wanted_searches')}
          subtitle={t('wanted_searches.subtitle')}
          showBack
          backFallback="/(tabs)/settings"
        />
      </View>

      {wizard.loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={wizard.refreshing}
              onRefresh={wizard.refresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <ExpoGoPushBanner />

          <FeatureAccessBanner
            featureAccess={wizard.config?.featureAccess}
            onPay={() => void handlePay()}
            isPaying={isPaying}
          />

          {wizard.error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{wizard.error}</Text>
            </View>
          ) : null}

          <View pointerEvents={wizard.accessGranted ? 'auto' : 'none'} style={!wizard.accessGranted && styles.disabledBlock}>
            <WantedSearchForm key={formResetKey} wizard={wizard} />

            {wizard.searches.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('wanted_searches.your_alerts')}</Text>
                <View style={styles.alertList}>
                  {wizard.searches.map((search) => (
                    <WantedSearchAlertCard
                      key={search.id}
                      search={search}
                      onEdit={wizard.startEdit}
                      onDelete={confirmDelete}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell color={colors.primaryLight} size={18} />
              <Text style={styles.sectionTitle}>{t('wanted_searches.matches_title')}</Text>
            </View>
            <Text style={styles.sectionSubtitle}>{t('wanted_searches.matches_subtitle')}</Text>

            {wizard.matches.length === 0 ? (
              <View style={styles.emptyMatches}>
                <Text style={styles.emptyText}>{t('wanted_searches.no_matches')}</Text>
              </View>
            ) : (
              <View style={styles.matchGrid}>
                {wizard.matches.map((announcement) => (
                  <WantedMatchCard key={announcement.id} announcement={announcement} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmActionModal
        visible={deleteTarget != null}
        tone="danger"
        icon={Trash2}
        title={t('wanted_searches.delete_title')}
        message={t('wanted_searches.delete_confirm')}
        confirmLabel={t('actions.delete')}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.errorMuted,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
  },
  disabledBlock: {
    opacity: 0.55,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  alertList: {
    gap: spacing.sm,
  },
  emptyMatches: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  matchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
