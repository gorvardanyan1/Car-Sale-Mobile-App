import { describe, expect, it } from 'vitest';

import { getConversationDisplay, formatChatTime } from '@/lib/chat/conversationDisplay';
import type { ChatConversation } from '@/types/chat';

const t = (key: string) => key;

const baseAnnConv: ChatConversation = {
  _id: 'conv1',
  announcementId: 10,
  buyerId: 1,
  ownerId: 2,
  participants: [1, 2],
  unreadCount: 0,
  kind: 'announcement',
  announcement: {
    id: 10,
    main_image_path: 'storage/images/car.jpg',
    car_brand: { id: 1, brand: 'BMW' },
    car_model: { id: 1, model: 'X5' },
    user_id: 2,
  },
};

const baseDealerConv: ChatConversation = {
  _id: 'conv2',
  announcementId: 0,
  buyerId: 3,
  ownerId: 5,
  participants: [3, 5],
  unreadCount: 0,
  kind: 'dealer',
  dealer: { id: 5, name: 'AutoPro', logo: null },
  buyer: { id: 3, name: 'Alice' },
};

describe('getConversationDisplay', () => {
  it('returns brand/model title for announcement conversations', () => {
    const display = getConversationDisplay(baseAnnConv, 1, t);
    expect(display.title).toBe('BMW X5');
    expect(display.initials).toBe('B');
  });

  it('returns storage image url for announcement conversations', () => {
    const display = getConversationDisplay(baseAnnConv, 1, t);
    expect(display.imageUrl).toContain('car.jpg');
  });

  it('returns null imageUrl when no main_image_path', () => {
    const conv = {
      ...baseAnnConv,
      announcement: { ...baseAnnConv.announcement!, main_image_path: null },
    };
    const display = getConversationDisplay(conv, 1, t);
    expect(display.imageUrl).toBeNull();
  });

  it('returns dealer name as title when viewing as buyer', () => {
    const display = getConversationDisplay(baseDealerConv, 3, t);
    expect(display.title).toBe('AutoPro');
  });

  it('returns buyer name as title when viewing as dealer owner', () => {
    const display = getConversationDisplay(baseDealerConv, 5, t);
    expect(display.title).toBe('Alice');
    expect(display.imageUrl).toBeNull();
  });

  it('falls back to translated key when dealer name is missing', () => {
    const conv: ChatConversation = { ...baseDealerConv, dealer: { id: 5, name: '', logo: null } };
    const display = getConversationDisplay(conv, 3, t);
    expect(display.title).toBe('dealer.message');
  });
});

describe('formatChatTime', () => {
  it('returns empty string for null input', () => {
    expect(formatChatTime(null)).toBe('');
    expect(formatChatTime(undefined)).toBe('');
  });

  it('returns "now" for very recent timestamps', () => {
    const result = formatChatTime(new Date(Date.now() - 10_000));
    expect(result).toBe('now');
  });

  it('returns minutes for timestamps within an hour', () => {
    const result = formatChatTime(new Date(Date.now() - 5 * 60_000));
    expect(result).toBe('5m');
  });

  it('returns hours for timestamps within a day', () => {
    const result = formatChatTime(new Date(Date.now() - 3 * 3_600_000));
    expect(result).toBe('3h');
  });

  it('returns days for older timestamps', () => {
    const result = formatChatTime(new Date(Date.now() - 2 * 86_400_000));
    expect(result).toBe('2d');
  });

  it('accepts ISO string input', () => {
    const result = formatChatTime(new Date(Date.now() - 10 * 60_000).toISOString());
    expect(result).toBe('10m');
  });
});
