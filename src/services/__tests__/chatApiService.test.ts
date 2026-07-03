import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import {
  fetchChatToken,
  fetchConversations,
  fetchUnreadSummary,
  fetchMessages,
  addConversation,
  addDealerConversation,
  markConversationReadRest,
  deleteConversation,
} from '@/services/chatApiService';
import type { ChatConversation, ChatMessageShape } from '@/types/chat';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiFetch: vi.fn() };
});

const mockApiFetch = vi.mocked(apiFetch);

describe('chatApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchChatToken', () => {
    it('returns the token string from the response', async () => {
      mockApiFetch.mockResolvedValue({ data: { token: 'test-jwt-token' } });

      const token = await fetchChatToken();

      expect(token).toBe('test-jwt-token');
      expect(mockApiFetch).toHaveBeenCalledWith('/chat/token', { auth: true });
    });

    it('propagates errors from apiFetch', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));
      await expect(fetchChatToken()).rejects.toThrow('Network error');
    });
  });

  describe('fetchConversations', () => {
    it('returns array of conversations', async () => {
      const convs: Partial<ChatConversation>[] = [
        { _id: 'abc123', buyerId: 1, ownerId: 2, announcementId: 10, unreadCount: 0, participants: [1, 2] },
      ];
      mockApiFetch.mockResolvedValue({ data: convs });

      const result = await fetchConversations();

      expect(result).toEqual(convs);
      expect(mockApiFetch).toHaveBeenCalledWith('/chat/conversations', { auth: true });
    });

    it('returns empty array when data is not an array', async () => {
      mockApiFetch.mockResolvedValue({ data: null });

      const result = await fetchConversations();

      expect(result).toEqual([]);
    });
  });

  describe('fetchUnreadSummary', () => {
    it('returns unread summary', async () => {
      mockApiFetch.mockResolvedValue({ data: { totalUnread: 5 } });

      const result = await fetchUnreadSummary();

      expect(result.totalUnread).toBe(5);
    });
  });

  describe('fetchMessages', () => {
    it('fetches messages with encoded conversationId', async () => {
      const messages: Partial<ChatMessageShape>[] = [
        { _id: 'msg1', senderId: 1, receiverId: 2, text: 'Hello', isRead: false },
      ];
      mockApiFetch.mockResolvedValue({ data: messages });

      const result = await fetchMessages('conv-abc');

      expect(result).toEqual(messages);
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/chat/messages?conversationId=conv-abc',
        { auth: true },
      );
    });

    it('returns empty array when data is null', async () => {
      mockApiFetch.mockResolvedValue({ data: null });
      const result = await fetchMessages('conv-abc');
      expect(result).toEqual([]);
    });
  });

  describe('addConversation', () => {
    it('posts announcementId to the add endpoint', async () => {
      mockApiFetch.mockResolvedValue({ data: { success: true } });

      await addConversation(42);

      expect(mockApiFetch).toHaveBeenCalledWith('/chat/conversations/add', {
        method: 'POST',
        auth: true,
        body: { announcementId: 42 },
      });
    });
  });

  describe('addDealerConversation', () => {
    it('posts ownerId to the add-dealer endpoint', async () => {
      mockApiFetch.mockResolvedValue({ data: { success: true } });

      await addDealerConversation(7);

      expect(mockApiFetch).toHaveBeenCalledWith('/chat/conversations/add-dealer', {
        method: 'POST',
        auth: true,
        body: { ownerId: 7 },
      });
    });
  });

  describe('markConversationReadRest', () => {
    it('posts to the read endpoint', async () => {
      mockApiFetch.mockResolvedValue({ data: {} });

      await markConversationReadRest('conv-123');

      expect(mockApiFetch).toHaveBeenCalledWith('/chat/conversations/conv-123/read', {
        method: 'POST',
        auth: true,
      });
    });
  });

  describe('deleteConversation', () => {
    it('sends DELETE to the conversation endpoint', async () => {
      mockApiFetch.mockResolvedValue({ data: {} });

      await deleteConversation('conv-456');

      expect(mockApiFetch).toHaveBeenCalledWith('/chat/conversations/conv-456', {
        method: 'DELETE',
        auth: true,
      });
    });
  });
});
