import { describe, expect, it } from 'vitest';

import {
  formatDealerLocationLine,
  getDealerImageUrl,
  getDealerInitial,
  isTopPerformerDealer,
} from '@/lib/dealers/dealerDisplay';

describe('dealerDisplay', () => {
  it('detects top performer dealers', () => {
    expect(isTopPerformerDealer({ sold_listings: 5 })).toBe(true);
    expect(isTopPerformerDealer({ sold_listings: 4 })).toBe(false);
  });

  it('formats dealer location line', () => {
    expect(formatDealerLocationLine('Yerevan', 'SUV, Sedan')).toBe('Yerevan · SUV, Sedan');
    expect(formatDealerLocationLine(null, 'Luxury')).toBe('Luxury');
  });

  it('returns dealer initial', () => {
    expect(getDealerInitial('Best Motors')).toBe('B');
  });

  it('resolves relative storage urls for dealer media', () => {
    expect(getDealerImageUrl('/storage/dealers/1/logo.jpg')).toContain('/storage/dealers/1/logo.jpg');
    expect(getDealerImageUrl('https://cdn.example.com/logo.jpg')).toBe('https://cdn.example.com/logo.jpg');
  });
});
