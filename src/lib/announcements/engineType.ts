import type { TFunction } from 'i18next';

export const ENGINE_TYPE_ELECTRO = 'electro';

export function formatEngineTypeLabel(
  t: TFunction,
  engineType: string | { value?: string } | null | undefined,
): string {
  if (!engineType) {
    return '—';
  }

  const value =
    typeof engineType === 'object' && engineType !== null && 'value' in engineType
      ? engineType.value
      : String(engineType);

  if (!value) {
    return '—';
  }

  return t(`announcement.engine_type.${value}`, { defaultValue: value });
}

export function shouldHideEngineCapacity(
  engineType: string | null | undefined,
  hiddenFields?: string[] | null,
): boolean {
  if (engineType === ENGINE_TYPE_ELECTRO) {
    return true;
  }

  return Array.isArray(hiddenFields) && hiddenFields.includes('engine_capacity');
}
