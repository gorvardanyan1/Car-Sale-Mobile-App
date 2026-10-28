import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import {
  fetchChatSession,
  fetchConversations,
  fetchUnreadSummary,
  fetchMessages,
  addConversation,
  addDealerConversation,
  markConversationReadRest,
  deleteConversation,
  sendVoiceMessage,
} from '@/services/chatApiService';
import type { ChatConversation, ChatMessageShape } from '@/types/chat';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiFetch: vi.fn() };
});

const RECORDING_BYTES = new Uint8Array([1, 2, 3, 4]).buffer;

vi.mock('expo-file-system', () => ({
  File: class {
    constructor(public uri: string) {}
    arrayBuffer() {
      return Promise.resolve(RECORDING_BYTES);
    }
  },
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('chatApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchChatSession', () => {
    it('returns the token together with the admin-configured settings', async () => {
      mockApiFetch.mockResolvedValue({
        data: {
          token: 'test-jwt-token',
          settings: {
            enabled: true,
            dealerChatEnabled: false,
            translationEnabled: true,
            emojiPickerEnabled: true,
            typingIndicatorEnabled: false,
            presenceEnabled: true,
            messageMaxLength: 1500,
          },
        },
      });

      const session = await fetchChatSession();

      expect(session.token).toBe('test-jwt-token');
      expect(session.settings.typingIndicatorEnabled).toBe(false);
      expect(session.settings.dealerChatEnabled).toBe(false);
      expect(session.settings.messageMaxLength).toBe(1500);
      expect(mockApiFetch).toHaveBeenCalledWith('/chat/token', { auth: true });
    });

    it('falls back to everything enabled when an older backend omits settings', async () => {
      mockApiFetch.mockResolvedValue({ data: { token: 'test-jwt-token' } });

      const session = await fetchChatSession();

      expect(session.settings).toEqual({
        enabled: true,
        dealerChatEnabled: true,
        translationEnabled: true,
        replySuggestionsEnabled: true,
        emojiPickerEnabled: true,
        typingIndicatorEnabled: true,
        presenceEnabled: true,
        messageMaxLength: 4000,
      });
    });

    it('fills only the fields the backend omitted, keeping the ones it sent', async () => {
      mockApiFetch.mockResolvedValue({
        data: { token: 't', settings: { typingIndicatorEnabled: false } },
      });

      const session = await fetchChatSession();

      expect(session.settings.typingIndicatorEnabled).toBe(false);
      expect(session.settings.messageMaxLength).toBe(4000);
      expect(session.settings.enabled).toBe(true);
    });

    it('propagates errors from apiFetch', async () => {
      mockApiFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchChatSession()).rejects.toThrow('Network error');
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

  describe('sendVoiceMessage', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock);
      fetchMock.mockReset();
    });

    const params = {
      conversationId: 'conv-1',
      fileUri: 'file:///cache/rec.m4a',
      durationMs: 4200.4,
      chatToken: 'chat-jwt',
    };

    it('uploads the raw recording to the chat server with the chat JWT and returns the saved message', async () => {
      const saved = { _id: 'm1', type: 'voice', audio: { mimeType: 'audio/mp4', durationMs: 4200, size: 4 } };
      fetchMock.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(saved) });

      const result = await sendVoiceMessage({ ...params, replyToId: 'quoted-1' });

      expect(result).toEqual(saved);
      const [url, init] = fetchMock.mock.calls[0];
      const parsed = new URL(url as string);
      expect(parsed.pathname).toBe('/api/messages/voice');
      expect(parsed.searchParams.get('conversationId')).toBe('conv-1');
      expect(parsed.searchParams.get('durationMs')).toBe('4200');
      expect(parsed.searchParams.get('replyToId')).toBe('quoted-1');
      expect(init.method).toBe('POST');
      expect(init.headers).toEqual({ Authorization: 'Bearer chat-jwt', 'Content-Type': 'audio/mp4' });
      expect(init.body).toBe(RECORDING_BYTES);
    });

    it('omits replyToId when the message is not a reply', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ _id: 'm1' }) });

      await sendVoiceMessage(params);

      expect(new URL(fetchMock.mock.calls[0][0] as string).searchParams.has('replyToId')).toBe(false);
    });

    it('throws the server message and exposes the status on failure', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 413,
        json: () => Promise.resolve({ message: 'Voice message is too large' }),
      });

      await expect(sendVoiceMessage(params)).rejects.toMatchObject({
        message: 'Voice message is too large',
        status: 413,
      });
    });

    it('falls back to a generic message when the error body is not JSON', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.reject(new Error('not json')),
      });

      await expect(sendVoiceMessage(params)).rejects.toMatchObject({
        message: 'Failed to send voice message',
        status: 401,
      });
    });
  });
});
