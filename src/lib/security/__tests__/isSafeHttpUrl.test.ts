import { describe, expect, it } from 'vitest';

import { isSafeHttpUrl } from '@/lib/security/isSafeHttpUrl';

describe('isSafeHttpUrl', () => {
  it('allows http and https URLs', () => {
    expect(isSafeHttpUrl('https://example.com/path')).toBe(true);
    expect(isSafeHttpUrl('http://autohayq.local/dealer')).toBe(true);
  });

  it('rejects non-http schemes', () => {
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeHttpUrl('file:///etc/passwd')).toBe(false);
    expect(isSafeHttpUrl('intent://scan/#Intent;scheme=zxing;end')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeHttpUrl('')).toBe(false);
    expect(isSafeHttpUrl('not-a-url')).toBe(false);
  });
});
