/**
 * Returns true only for http/https URLs with a host.
 * Blocks javascript:, file:, intent:, and other schemes.
 */
export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}
