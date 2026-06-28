import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { getTabIcon } from '@/components/navigation/tabIcons';
import { getTabBadgeCount, TAB_ITEMS, type TabRouteName } from '@/constants/navigation';
import { colors, gradients, radii, shadows, spacing, typography } from '@/theme';

type TabBarRoute = {
  key: string;
  name: string;
};

type TabBarProps = {
  state: {
    index: number;
    routes: TabBarRoute[];
  };
  descriptors: Record<
    string,
    {
      options: {
        title?: string;
      };
    }
  >;
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => {
      defaultPrevented: boolean;
    };
    navigate: (name: string, params?: object) => void;
  };
};

export function TabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const tab = TAB_ITEMS.find((item) => item.name === route.name);
          if (!tab) {
            return null;
          }

          const isFocused = state.index === index;
          const label = t(tab.labelKey);
          const badge = getTabBadgeCount(route.name as TabRouteName);
          const Icon = getTabIcon(tab.iconName);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (tab.isFab) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                style={styles.fabSlot}
              >
                <View style={[styles.fabOuter, isFocused && styles.fabOuterActive]}>
                  <LinearGradient
                    colors={[...gradients.primary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.fab}
                  >
                    <Icon color={colors.white} size={24} strokeWidth={2.5} />
                  </LinearGradient>
                </View>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={styles.iconWrap}>
                {isFocused ? (
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.2)', 'rgba(30, 64, 175, 0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.activeIconBg}
                  >
                    <Icon
                      color={colors.primaryLight}
                      size={20}
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveIconBg}>
                    <Icon color={colors.textDisabled} size={20} strokeWidth={2} />
                  </View>
                )}
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.navBorder,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
  },
  iconWrap: {
    position: 'relative',
  },
  activeIconBg: {
    width: 36,
    height: 36,
    borderRadius: radii.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIconBg: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.tabLabel,
    color: colors.textDisabled,
  },
  labelActive: {
    color: colors.primaryLight,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  fabSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -20,
  },
  fabOuter: {
    borderRadius: radii.fab,
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.fab,
  },
  fabOuterActive: {
    transform: [{ scale: 1.04 }],
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radii.fab,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
