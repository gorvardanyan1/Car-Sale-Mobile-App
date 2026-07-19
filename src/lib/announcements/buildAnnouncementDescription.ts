import type { CreateAnnouncementFormState } from '@/types/announcement';

export function buildAnnouncementDescriptionPayload(form: CreateAnnouncementFormState): string {
  const description = form.description.trim();

  if (!form.translationsEnabled) {
    return description;
  }

  return JSON.stringify({
    en: description,
    am: form.translations.am || '',
    ru: form.translations.ru || '',
  });
}
