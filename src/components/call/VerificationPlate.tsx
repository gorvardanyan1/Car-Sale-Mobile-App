import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react-native';

import { formatVerificationCode } from '@/lib/calls/callCrypto';
import { colors, spacing, typography } from '@/theme';

/**
 * The call's E2EE verification code, set like a registration plate — the
 * blue band where the country code would be carries the lock instead. Both
 * people see the same six digits only if nobody swapped keys in between.
 */
export function VerificationPlate({ code }: { code: string }) {
  const { t } = useTranslation();

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${t('mobile.call.e2ee_label')}: ${code.split('').join(' ')}. ${t('mobile.call.e2ee_hint')}`}
      testID="call-verification"
    >
      <View style={styles.plate}>
        <View style={styles.band}>
          <Lock size={14} color={colors.white} />
        </View>
        <Text style={styles.code}>{formatVerificationCode(code)}</Text>
      </View>
      <Text style={styles.caption}>{t('mobile.call.e2ee_label')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  plate: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#111827',
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  band: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  code: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    fontVariant: ['tabular-nums'],
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  caption: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
});
