import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, typography } from '@/theme';

type FieldLabelProps = {
  label: string;
  required?: boolean;
  showOptionalHint?: boolean;
};

export function FieldLabel({ label, required = false, showOptionalHint = true }: FieldLabelProps) {
  const { t } = useTranslation();

  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  required: {
    color: colors.error,
    fontWeight: '700',
  },
  optional: {
    color: colors.textDisabled,
    fontWeight: '500',
  },
});
