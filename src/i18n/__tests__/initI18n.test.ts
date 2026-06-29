import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

vi.mock('@/lib/i18n/languageStorage', () => ({
  getStoredLanguage: vi.fn(async () => null),
  isSupportedLanguage: (value: string | null | undefined) =>
    value === 'en' || value === 'am' || value === 'ru',
}));

describe('initI18n', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('resolves my announcements keys after init', async () => {
    const { default: i18n, initI18n } = await import('@/i18n');

    await initI18n();

    expect(i18n.t('my_announcements.title')).toBe('My Car Listings');
    expect(i18n.t('my_announcements.sort.newest')).toBe('Newest First');
    expect(i18n.t('status.active')).toBe('Active');
    expect(i18n.t('actions.see')).toBe('View');
  });
});
