import { ChevronDown } from 'lucide-react-native';
import { ReactNode, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FieldLabel } from '@/components/ui/FieldLabel';
import { colors, radii, spacing, typography } from '@/theme';

export type SelectOption<T extends string | number = string> = {
  value: T | '';
  label: string;
  icon?: string | null;
};

type SelectFieldProps<T extends string | number = string> = {
  label: string;
  value: T | '' | null | undefined;
  options: SelectOption<T>[];
  onChange: (value: T | '') => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  required?: boolean;
  showOptionalHint?: boolean;
};

export function SelectField<T extends string | number = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  searchable = false,
  disabled = false,
  required = false,
  showOptionalHint = true,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => String(option.value) === String(value));
  const filtered = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} showOptionalHint={showOptionalHint} />
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.trigger, disabled && styles.triggerDisabled]}
      >
        {selected?.icon ? (
          <Image source={{ uri: selected.icon }} style={styles.triggerIcon} resizeMode="contain" />
        ) : null}
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown color={colors.textSubtle} size={16} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {searchable ? (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.inputPlaceholder}
                style={styles.searchInput}
              />
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(item) => String(item.value)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = String(item.value) === String(value);
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                      setQuery('');
                    }}
                    style={[styles.option, isSelected && styles.optionSelected]}
                  >
                    {item.icon ? (
                      <Image source={{ uri: item.icon }} style={styles.optionIcon} resizeMode="contain" />
                    ) : null}
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

type NumberFieldProps = {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: ReactNode;
  required?: boolean;
  showOptionalHint?: boolean;
};

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  required = false,
  showOptionalHint = true,
}: NumberFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} showOptionalHint={showOptionalHint} />
      <View style={styles.numberRow}>
        <TextInput
          value={value !== undefined && value !== null ? String(value) : ''}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.inputPlaceholder}
          keyboardType="numeric"
          style={styles.numberInput}
        />
        {suffix}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  triggerIcon: {
    width: 20,
    height: 20,
  },
  triggerText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  placeholder: {
    color: colors.inputPlaceholder,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sheetTitle: {
    ...typography.sectionTitle,
    color: colors.text,
  },
  searchInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  optionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  optionIcon: {
    width: 22,
    height: 22,
  },
  optionText: {
    ...typography.body,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  optionTextSelected: {
    color: colors.primaryLight,
    fontWeight: '600',
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  numberInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radii.button,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
});
