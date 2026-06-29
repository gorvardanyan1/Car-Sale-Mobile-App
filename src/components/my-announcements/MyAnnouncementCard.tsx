import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  Car,
  CheckCircle,
  CircleDollarSign,
  Clock,
  Eye,
  Flame,
  Gauge,
  Heart,
  Zap,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  formatAnnouncementPrice,
  formatHorsepower,
  formatTransmission,
  getAnnouncementImageUrl,
  getAnnouncementLikesCount,
  getAnnouncementShareUrl,
  getAnnouncementTitle,
  getAnnouncementViewsCount,
  getMileageDisplay,
} from '@/lib/announcements/formatAnnouncement';
import { formatTimeAgo } from '@/lib/announcements/formatTimeAgo';
import { getAnnouncementStatusLabel } from '@/lib/announcements/getAnnouncementStatusLabel';
import { MakeAsUrgent } from '@/components/my-announcements/MakeAsUrgent';
import type { Announcement } from '@/types/announcement';
import type { FeatureAccessInfo } from '@/types/payment';
import { colors, gradients, radii, spacing, typography } from '@/theme';

type MyAnnouncementCardProps = {
  announcement: Announcement;
  urgentPriceCents: number;
  urgentFeatureAccess: FeatureAccessInfo | null;
  onView: (announcement: Announcement) => void;
  onEdit: (announcement: Announcement) => void;
  onMarkSold: (announcement: Announcement) => void;
  onDelete: (announcement: Announcement) => void;
  onUrgentSuccess?: (announcement: Announcement) => void;
};

function getStatusColors(status: string | null | undefined) {
  switch (status) {
    case 'active':
      return gradients.success;
    case 'pending':
      return gradients.urgent;
    case 'sold':
      return ['#64748B', '#334155'] as const;
    default:
      return ['#9CA3AF', '#4B5563'] as const;
  }
}

export function MyAnnouncementCard({
  announcement,
  urgentPriceCents,
  urgentFeatureAccess,
  onView,
  onEdit,
  onMarkSold,
  onDelete,
  onUrgentSuccess,
}: MyAnnouncementCardProps) {
  const { t } = useTranslation();
  const [shareMessage, setShareMessage] = useState('');
  const imageUrl = getAnnouncementImageUrl(announcement);
  const isUrgent = announcement.is_hurry === 'yes';
  const isSold = announcement.status === 'sold';
  const title = getAnnouncementTitle(announcement);
  const statusColors = getStatusColors(announcement.status);

  async function handleShare() {
    try {
      await Share.share({
        message: getAnnouncementShareUrl(announcement.id),
      });
      setShareMessage(t('my_announcements.link_copied'));
    } catch {
      setShareMessage(t('my_announcements.share_copy_failed'));
    } finally {
      setTimeout(() => setShareMessage(''), 2000);
    }
  }

  function confirmDelete() {
    Alert.alert(t('actions.delete'), t('my_announcements.remove_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('actions.delete'),
        style: 'destructive',
        onPress: () => onDelete(announcement),
      },
    ]);
  }

  function confirmMarkSold() {
    Alert.alert(t('my_announcements.mark_as_sold'), t('my_announcements.sold_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('my_announcements.mark_as_sold'),
        onPress: () => onMarkSold(announcement),
      },
    ]);
  }

  return (
    <View
      style={[styles.card, isUrgent && styles.cardUrgent]}
      testID={`my-announcement-card-${announcement.id}`}
    >
      <View style={styles.row}>
        <View style={styles.imageWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Car color={colors.textDisabled} size={28} />
            </View>
          )}

          {isUrgent ? (
            <LinearGradient colors={[...gradients.urgent]} style={styles.urgentBadge}>
              <Flame color={colors.white} size={12} fill={colors.white} />
              <Text style={styles.urgentText}>{t('my_announcements.urgent_sale')}</Text>
            </LinearGradient>
          ) : null}

          <View style={styles.imageViews}>
            <Eye color={colors.white} size={11} />
            <Text style={styles.imageViewsText}>{getAnnouncementViewsCount(announcement)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.metaRow}>
            {announcement.year ? (
              <View style={styles.metaItem}>
                <Calendar color={colors.textSubtle} size={12} />
                <Text style={styles.metaText}>{announcement.year}</Text>
              </View>
            ) : null}
            {getMileageDisplay(announcement) ? (
              <View style={styles.metaItem}>
                <Gauge color={colors.textSubtle} size={12} />
                <Text style={styles.metaText}>{getMileageDisplay(announcement)}</Text>
              </View>
            ) : null}
            {announcement.transmission ? (
              <View style={styles.metaItem}>
                <Car color={colors.textSubtle} size={12} />
                <Text style={styles.metaText}>{formatTransmission(announcement.transmission)}</Text>
              </View>
            ) : null}
            {announcement.horsepower ? (
              <View style={styles.metaItem}>
                <Zap color={colors.textSubtle} size={12} />
                <Text style={styles.metaText}>{formatHorsepower(announcement.horsepower)}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.price}>{formatAnnouncementPrice(announcement)}</Text>

          <View style={styles.badgeRow}>
            <LinearGradient colors={[...statusColors]} style={styles.statusBadge}>
              {announcement.status === 'active' ? (
                <CheckCircle color={colors.white} size={11} />
              ) : null}
              {announcement.status === 'pending' ? <Clock color={colors.white} size={11} /> : null}
              {announcement.status === 'sold' ? (
                <CircleDollarSign color={colors.white} size={11} />
              ) : null}
              <Text style={styles.statusText}>
                {getAnnouncementStatusLabel(announcement.status, t)}
              </Text>
            </LinearGradient>

            <View style={styles.statChip}>
              <Eye color={colors.primaryLight} size={12} />
              <Text style={styles.statChipText}>{getAnnouncementViewsCount(announcement)}</Text>
            </View>

            <View style={styles.statChipPink}>
              <Heart color="#F472B6" size={12} />
              <Text style={styles.statChipPinkText}>{getAnnouncementLikesCount(announcement)}</Text>
            </View>

            <Text style={styles.timeAgo}>{formatTimeAgo(announcement.created_at)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {!isSold ? (
          <MakeAsUrgent
            isHurry={announcement.is_hurry}
            announcementId={announcement.id}
            urgentPriceCents={urgentPriceCents}
            urgentFeatureAccess={urgentFeatureAccess}
            onSuccess={() => onUrgentSuccess?.(announcement)}
          />
        ) : null}
        {!isSold ? (
          <ActionButton label={t('actions.edit')} onPress={() => onEdit(announcement)} tone="blue" />
        ) : null}
        <ActionButton label={t('actions.see')} onPress={() => onView(announcement)} tone="green" />
        <ActionButton
          label={shareMessage || t('my_announcements.share')}
          onPress={() => void handleShare()}
          tone="purple"
        />
        {!isSold ? (
          <ActionButton
            label={t('my_announcements.mark_as_sold')}
            onPress={confirmMarkSold}
            tone="amber"
          />
        ) : null}
        <ActionButton label={t('actions.delete')} onPress={confirmDelete} tone="red" />
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  tone,
}: {
  label: string;
  onPress: () => void;
  tone: 'green' | 'purple' | 'amber' | 'red' | 'blue';
}) {
  const toneStyle = {
    green: styles.actionGreen,
    purple: styles.actionPurple,
    amber: styles.actionAmber,
    red: styles.actionRed,
    blue: styles.actionBlue,
  }[tone];

  const toneTextStyle = {
    green: styles.actionGreenText,
    purple: styles.actionPurpleText,
    amber: styles.actionAmberText,
    red: styles.actionRedText,
    blue: styles.actionBlueText,
  }[tone];

  return (
    <Pressable onPress={onPress} style={[styles.actionButton, toneStyle]}>
      <Text style={[styles.actionText, toneTextStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardUrgent: {
    borderColor: 'rgba(249, 115, 22, 0.65)',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  imageWrap: {
    width: 112,
    aspectRatio: 4 / 3,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  urgentText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  imageViews: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
  },
  imageViewsText: {
    ...typography.caption,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    gap: 6,
  },
  title: {
    ...typography.sectionTitle,
    color: colors.text,
    fontSize: 16,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSubtle,
    fontSize: 11,
  },
  price: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primaryLight,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statChipText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '700',
    fontSize: 11,
  },
  statChipPink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(244, 114, 182, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  statChipPinkText: {
    ...typography.caption,
    color: '#F472B6',
    fontWeight: '700',
    fontSize: 11,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.textDisabled,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  actionButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
    fontSize: 12,
  },
  actionGreen: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  actionGreenText: { color: '#4ADE80' },
  actionPurple: {
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
    borderColor: 'rgba(168, 85, 247, 0.25)',
  },
  actionPurpleText: { color: '#C084FC' },
  actionAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  actionAmberText: { color: '#FBBF24' },
  actionRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  actionRedText: { color: '#F87171' },
  actionBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  actionBlueText: { color: colors.primaryLight },
});
