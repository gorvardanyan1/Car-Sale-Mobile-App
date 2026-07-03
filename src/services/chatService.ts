import { apiFetch } from '@/lib/api/client';
import type { ApiResponse } from '@/types';

type AddDealerConversationResponse = {
  success?: boolean;
  error?: string;
};

export async function addDealerConversation(ownerId: number): Promise<AddDealerConversationResponse> {
  const response = await apiFetch<ApiResponse<AddDealerConversationResponse>>(
    '/chat/conversations/add-dealer',
    {
      method: 'POST',
      auth: true,
      body: { ownerId },
    },
  );

  return response.data ?? {};
}
