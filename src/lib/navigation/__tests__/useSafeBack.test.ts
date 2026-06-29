import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSafeBackHandler } from '@/lib/navigation/safeBack';

describe('createSafeBackHandler', () => {
  const mockBack = vi.fn();
  const mockReplace = vi.fn();
  const mockCanGoBack = vi.fn();

  const router = {
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  };

  beforeEach(() => {
    mockBack.mockReset();
    mockReplace.mockReset();
    mockCanGoBack.mockReset();
  });

  it('calls router.back when history exists', () => {
    mockCanGoBack.mockReturnValue(true);

    createSafeBackHandler(router)();

    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('replaces with default tabs route when history is empty', () => {
    mockCanGoBack.mockReturnValue(false);

    createSafeBackHandler(router)();

    expect(mockBack).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('replaces with custom fallback when history is empty', () => {
    mockCanGoBack.mockReturnValue(false);

    createSafeBackHandler(router, '/settings/my-announcements')();

    expect(mockReplace).toHaveBeenCalledWith('/settings/my-announcements');
  });
});
