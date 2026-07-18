import type { TFunction } from 'i18next';

import { formatEngineTypeLabel } from './engineType';

export type ParsedMatchReason = {
  key: string;
  value: string | null;
};

/**
 * Reasons come from the backend as either a plain key ("same_model") or a
 * "key:value" pair ("same_transmission:automatic") when the matched value
 * itself is worth showing (see AnnouncementService::scoreSimilarCandidate
 * on the backend).
 */
export function parseMatchReason(reason: string): ParsedMatchReason {
  const [key, value] = reason.split(':');
  return { key, value: value ?? null };
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatMatchReasonLabel(t: TFunction, reason: string): string {
  const { key, value } = parseMatchReason(reason);
  const label = t(`announcement.similar.reason.${key}`, { defaultValue: key });

  if (!value) {
    return label;
  }

  const valueLabel = key === 'same_engine_type' ? formatEngineTypeLabel(t, value) : capitalize(value);

  return `${label} (${valueLabel})`;
}
