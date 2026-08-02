import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiFetch } from '@/lib/api/client';
import { fetchReferralOverview } from '@/services/referralService';

vi.mock('@/lib/api/client', () => ({
  apiFetch: vi.fn(),
}));

describe('referralService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches the referral overview with auth', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      data: {
        enabled: true,
        referral_code: 'AB3D9F2K',
        referral_url: 'https://autohayq.loc/register?ref=AB3D9F2K',
        points_balance: 125,
        point_value_cents: 10,
        stats: { invited: 2, points_earned: 125 },
        history: [
          {
            id: 1,
            amount: 25,
            balance_after: 25,
            reason: 'referral',
            description: null,
            created_at: '2026-07-01T00:00:00Z',
          },
        ],
      },
    });

    const result = await fetchReferralOverview();

    expect(apiFetch).toHaveBeenCalledWith('/referrals', { auth: true });
    expect(result.referral_code).toBe('AB3D9F2K');
    expect(result.stats.invited).toBe(2);
    expect(result.history).toHaveLength(1);
  });
});
