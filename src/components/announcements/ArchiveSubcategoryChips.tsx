import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { SubcategoryFilter } from '@/types/announcement';
import { colors, radii, spacing, typography } from '@/theme';

type ArchiveSubcategoryChipsProps = {
  subcategories: SubcategoryFilter[];
  activeSlug: string;
  onChange: (slug: string) => void;
};

export function ArchiveSubcategoryChips({
  subcategories,
  activeSlug,
  onChange,
}: ArchiveSubcategoryChipsProps) {
  const { t } = useTranslation();

  if (!subcategories.length) {
    return null;
  }

  const items = [{ slug: '', label: 'All' }, ...subcategories];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => {
        const isActive = (item.slug || '') === (activeSlug || '');
        const label = item.slug === '' ? t('mobile.archive.subcategory_all') : item.label || item.slug;

        return (
          <Pressable
            key={item.slug || 'all'}
            onPress={() => onChange(item.slug)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(31, 41, 55, 0.6)',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.transparent,
  },
  chipText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
  },
});
