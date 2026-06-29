import { Pencil, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { getWantedSearchTitle } from '@/lib/wanted-searches/wantedSearchForm';
import type { WantedSearch } from '@/types/wantedSearch';
import { colors, radii, spacing, typography } from '@/theme';

type WantedSearchAlertCardProps = {
  search: WantedSearch;
  onEdit: (search: WantedSearch) => void;
  onDelete: (search: WantedSearch) => void;
};

export function WantedSearchAlertCard({ search, onEdit, onDelete }: WantedSearchAlertCardProps) {
  const { t } = useTranslation();
  const title = getWantedSearchTitle(search, t('wanted_searches.any_brand'));

  const priceSummary =
    search.min_price || search.max_price
      ? ` · ${search.currency?.symbol ?? '$'}${search.min_price ?? '0'}-${search.max_price ?? '∞'}`
      : '';

  return (
    <View style={styles.card} testID={`wanted-search-alert-${search.id}`}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {search.category?.name}
          {priceSummary}
          {search.mileage_unit ? ` · ${search.mileage_unit}` : ''}
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => onEdit(search)} style={styles.iconButton} accessibilityRole="button">
          <Pencil color={colors.primaryLight} size={16} />
        </Pressable>
        <Pressable onPress={() => onDelete(search)} style={styles.iconButton} accessibilityRole="button">
          <Trash2 color="#F87171" size={16} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 15,
  },
  meta: {
    ...typography.caption,
    color: colors.textSubtle,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
});
