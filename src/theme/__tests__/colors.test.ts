import { describe, expect, it } from 'vitest';

import { colors, gradients } from '@/theme/colors';

describe('theme colors', () => {
  it('uses Figma dark background and primary blue gradient', () => {
    expect(colors.background).toBe('#0F1117');
    expect(colors.primary).toBe('#3B82F6');
    expect(colors.primaryDark).toBe('#1E40AF');
    expect(gradients.primary).toEqual(['#3B82F6', '#1E40AF']);
  });
});
