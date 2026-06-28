import { Building2, CheckCircle2, User } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { AccountType } from '@/types';
import { colors, radii, spacing, typography } from '@/theme';

type AccountTypeToggleProps = {
  value: AccountType;
  onChange: (value: AccountType) => void;
};

export function AccountTypeToggle({ value, onChange }: AccountTypeToggleProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{t('auth.account_type')}</Text>
      <View style={styles.row}>
        <TypeOption
          label={t('auth.individual')}
          icon={User}
          selected={value === 'user'}
          onPress={() => onChange('user')}
        />
        <TypeOption
          label={t('auth.dealer')}
          icon={Building2}
          selected={value === 'dealer'}
          onPress={() => onChange('dealer')}
        />
      </View>
      {value === 'dealer' ? (
        <Text style={styles.hint}>{t('auth.register_as_dealer_hint')}</Text>
      ) : null}
    </View>
  );
}

type TypeOptionProps = {
  label: string;
  icon: typeof User;
  selected: boolean;
  onPress: () => void;
};

function TypeOption({ label, icon: Icon, selected, onPress }: TypeOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      {selected ? (
        <CheckCircle2 color={colors.primaryLight} size={16} style={styles.checkIcon} />
      ) : null}
      <Icon color={selected ? colors.primaryLight : colors.textSubtle} size={28} />
      <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  title: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radii.button,
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  optionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
  },
  optionLabelSelected: {
    color: colors.primaryLight,
  },
  hint: {
    ...typography.caption,
    color: colors.textSubtle,
    textAlign: 'center',
    lineHeight: 18,
  },
});
