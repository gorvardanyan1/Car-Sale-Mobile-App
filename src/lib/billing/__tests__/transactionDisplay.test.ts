import { describe, expect, it, vi } from 'vitest';

import {
  getSubscriptionTypeLabel,
  getTransactionInfoLabel,
  getTransactionTypeLabel,
} from '@/lib/billing/transactionDisplay';

const t = vi.fn((key: string) => key);

describe('transactionDisplay', () => {
  it('maps known transaction types to locale keys', () => {
    expect(getTransactionTypeLabel('urgent', t)).toBe('billing.transaction.urgent');
    expect(getTransactionTypeLabel('wanted_searches', t)).toBe('billing.transaction.wanted_searches');
  });

  it('formats unknown transaction types', () => {
    expect(getTransactionTypeLabel('custom_feature', t)).toBe('Custom Feature');
  });

  it('labels pro subscriptions', () => {
    expect(
      getSubscriptionTypeLabel(
        {
          id: 1,
          type: 'pro',
          feature_key: null,
          status: 'active',
          amount_cents: 1000,
          currency: 'usd',
          created_at: null,
          current_period_end: null,
          cancel_at_period_end: false,
          can_cancel: true,
        },
        t,
      ),
    ).toBe('billing.subscription.pro');
  });

  it('uses announcement label for transaction info', () => {
    expect(
      getTransactionInfoLabel({
        id: 1,
        type: 'urgent',
        status: 'completed',
        amount_cents: 2500,
        currency: 'usd',
        created_at: null,
        announcement: { id: 10, label: '#10 — BMW X5 2020' },
      }),
    ).toBe('#10 — BMW X5 2020');
  });
});
