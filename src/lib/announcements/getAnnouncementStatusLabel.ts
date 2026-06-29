import type { TFunction } from 'i18next';

const STATUS_LABEL_KEYS: Record<string, string> = {
  active: 'status.active',
  pending: 'status.pending',
  rejected: 'announcement.status_rejected',
  expired: 'status.expired',
  sold: 'status.sold',
};

export function getAnnouncementStatusLabel(
  status: string | null | undefined,
  t: TFunction,
): string {
  if (!status) {
    return '—';
  }

  const key = STATUS_LABEL_KEYS[status];
  return key ? t(key) : status;
}
