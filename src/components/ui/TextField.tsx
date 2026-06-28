import { Eye, EyeOff } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, radii, typography } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  secureToggle?: boolean;
  rightSlot?: ReactNode;
};

export function TextField({
  label,
  error,
  secureToggle = false,
  rightSlot,
  secureTextEntry,
  style,
  ...props
}: TextFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
        <TextInput
          {...props}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={colors.inputPlaceholder}
          style={[styles.input, style]}
        />
        {secureToggle ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((value) => !value)}
            hitSlop={8}
          >
            {hidden ? (
              <Eye color={colors.textSubtle} size={18} />
            ) : (
              <EyeOff color={colors.textSubtle} size={18} />
            )}
          </Pressable>
        ) : null}
        {rightSlot}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  inputRowError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingVertical: 10,
  },
  error: {
    ...typography.caption,
    color: colors.error,
  },
});
