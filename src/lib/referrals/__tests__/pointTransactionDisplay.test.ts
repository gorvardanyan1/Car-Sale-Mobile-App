import { describe, expect, it, vi } from 'vitest';

import { formatPointsAmount, getPointTransactionReasonLabel } from '@/lib/referrals/pointTransactionDisplay';

const t = vi.fn((key: string) => key);

describe('getPointTransactionReasonLabel', () => {
  it('prefers the transaction description when present', () => {
    const label = getPointTransactionReasonLabel(
      { reason: 'referral', description: 'Signup bonus from Jane' },
      t,
    );

    expect(label).toBe('Signup bonus from Jane');
  });

  it('maps known reasons to their translation key when no description exists', () => {
    expect(getPointTransactionReasonLabel({ reason: 'referral', description: null }, t)).toBe(
      'referral.reason_referral',
    );
    expect(
      getPointTransactionReasonLabel({ reason: 'urgent_redemption', description: null }, t),
    ).toBe('referral.reason_urgent_redemption');
    expect(
      getPointTransactionReasonLabel({ reason: 'admin_adjustment', description: null }, t),
    ).toBe('referral.reason_admin_adjustment');
  });

  it('falls back to the generic reason key for an unrecognized reason', () => {
    expect(getPointTransactionReasonLabel({ reason: 'birthday', description: null }, t)).toBe(
      'referral.reason_other',
    );
  });
});

describe('formatPointsAmount', () => {
  it('prefixes credits with a plus sign', () => {
    expect(formatPointsAmount(25)).toBe('+25');
  });

  it('leaves debits with their natural minus sign', () => {
    expect(formatPointsAmount(-10)).toBe('-10');
  });

  it('does not add a plus sign for zero', () => {
    expect(formatPointsAmount(0)).toBe('0');
  });
});
