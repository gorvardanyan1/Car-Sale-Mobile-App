import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  greeting?: string;
  rightSlot?: ReactNode;
  showBack?: boolean;
};

export function ScreenHeader({ title, subtitle, greeting, rightSlot, showBack = false }: ScreenHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <ChevronLeft color={colors.textSecondary} size={22} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        <View style={styles.textBlock}>
          {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightSlot}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: 2,
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSubtle,
    marginTop: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
