import type { SupportedLanguage } from '@/i18n';
import type { ChatMessageShape } from '@/types/chat';

const SUGGESTION_LANGUAGES: SupportedLanguage[] = ['en', 'am', 'ru'];

/**
 * Whether the "suggest a reply" affordance belongs at the end of the thread.
 *
 * Only when the other person spoke last: a draft reply to your own message is
 * noise, and an empty thread gives the model nothing to answer.
 */
export function shouldOfferReplySuggestion(
  messages: ChatMessageShape[],
  currentUserId: number | string | null | undefined,
): boolean {
  if (!Array.isArray(messages) || messages.length === 0) {
    return false;
  }

  if (currentUserId == null) {
    return false;
  }

  const last = messages[messages.length - 1];

  if (!last || typeof last.text !== 'string' || last.text.trim() === '') {
    return false;
  }

  return Number(last.senderId) !== Number(currentUserId);
}

/** Narrow an i18n locale ("ru-RU") to a language the endpoint accepts. */
export function toSuggestionLanguage(locale: string | null | undefined): SupportedLanguage {
  const base = String(locale ?? '')
    .toLowerCase()
    .split(/[-_]/)[0] as SupportedLanguage;

  return SUGGESTION_LANGUAGES.includes(base) ? base : 'en';
}
