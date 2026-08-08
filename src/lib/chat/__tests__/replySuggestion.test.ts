import { describe, expect, it } from 'vitest';

import { shouldOfferReplySuggestion, toSuggestionLanguage } from '../replySuggestion';
import type { ChatMessageShape } from '@/types/chat';

function message(overrides: Partial<ChatMessageShape> = {}): ChatMessageShape {
  return {
    _id: 'm1',
    conversationId: 'conv-1',
    senderId: 3,
    receiverId: 2,
    text: 'Yes, still available.',
    isRead: false,
    createdAt: '2026-01-01T10:00:00Z',
    ...overrides,
  };
}

const theirs = message();
const mine = message({ _id: 'm2', senderId: 2, receiverId: 3, text: 'Is it still available?' });

describe('shouldOfferReplySuggestion', () => {
  it('offers a draft when the other person spoke last', () => {
    expect(shouldOfferReplySuggestion([mine, theirs], 2)).toBe(true);
  });

  it('does not offer a draft reply to your own message', () => {
    expect(shouldOfferReplySuggestion([theirs, mine], 2)).toBe(false);
  });

  it('compares ids across string/number shapes', () => {
    expect(shouldOfferReplySuggestion([theirs], '2')).toBe(true);
    expect(shouldOfferReplySuggestion([mine], '2')).toBe(false);
  });

  it('has nothing to answer in an empty thread', () => {
    expect(shouldOfferReplySuggestion([], 2)).toBe(false);
  });

  it('ignores a trailing message with no usable text', () => {
    expect(shouldOfferReplySuggestion([mine, message({ text: '   ' })], 2)).toBe(false);
  });

  it('stays hidden while the signed-in user is unknown, so it cannot misread whose turn it is', () => {
    expect(shouldOfferReplySuggestion([mine, theirs], null)).toBe(false);
    expect(shouldOfferReplySuggestion([mine, theirs], undefined)).toBe(false);
  });
});

describe('toSuggestionLanguage', () => {
  it('passes through the languages the endpoint accepts', () => {
    expect(toSuggestionLanguage('en')).toBe('en');
    expect(toSuggestionLanguage('am')).toBe('am');
    expect(toSuggestionLanguage('ru')).toBe('ru');
  });

  it('narrows a regional locale to its base language', () => {
    expect(toSuggestionLanguage('ru-RU')).toBe('ru');
    expect(toSuggestionLanguage('AM')).toBe('am');
  });

  it('falls back to English for anything the endpoint would reject', () => {
    expect(toSuggestionLanguage('fr')).toBe('en');
    expect(toSuggestionLanguage('')).toBe('en');
    expect(toSuggestionLanguage(null)).toBe('en');
  });
});
