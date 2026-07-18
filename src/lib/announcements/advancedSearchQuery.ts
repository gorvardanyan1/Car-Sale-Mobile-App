/**
 * Boolean "advanced search" query builder/parser.
 *
 * Mirrors the web app's AdvancedSearchModal.jsx so the query strings produced
 * here are understood by the same backend parser (App\Services\AdvancedSearchParser):
 *   ( wordA AND wordB ) ( wordC OR wordD ) NOT ( wordE AND wordF ) ( AUTHOR IS name )
 */

export type AdvancedSearchFields = {
  allOfTheseWords: string;
  anyOfTheseWords: string;
  noneOfTheseWords: string;
  author: string;
};

export function emptyAdvancedSearchFields(): AdvancedSearchFields {
  return {
    allOfTheseWords: '',
    anyOfTheseWords: '',
    noneOfTheseWords: '',
    author: '',
  };
}

export function hasAdvancedSearchFields(fields: AdvancedSearchFields): boolean {
  return (
    fields.allOfTheseWords.trim() !== '' ||
    fields.anyOfTheseWords.trim() !== '' ||
    fields.noneOfTheseWords.trim() !== '' ||
    fields.author.trim() !== ''
  );
}

/**
 * Parse a raw boolean query string (as produced by buildAdvancedSearchQuery, or
 * typed directly into the plain search box) back into the four editable fields.
 */
export function parseAdvancedSearchQuery(query: string): AdvancedSearchFields {
  const result = emptyAdvancedSearchFields();

  const raw = (query ?? '').trim();
  if (!raw) {
    return result;
  }

  const authorMatch = raw.match(/\(\s*AUTHOR\s+IS\s+([^)]+)\s*\)/i);
  if (authorMatch) {
    result.author = authorMatch[1].trim();
  }

  const notMatch = raw.match(/NOT\s*\(\s*([^)]+)\s*\)/i);
  if (notMatch) {
    result.noneOfTheseWords = notMatch[1].trim().replace(/\s+AND\s+/gi, ' ');
  }

  const remaining = raw
    .replace(/NOT\s*\([^)]*\)/gi, '')
    .replace(/\(\s*AUTHOR\s+IS\s+[^)]+\)/gi, '')
    .trim();

  const orMatch = remaining.match(/\(\s*([^)]+)\s*\)/g);
  if (orMatch) {
    orMatch.forEach((group) => {
      const inner = group.replace(/^\(\s*|\s*\)$/g, '').trim();
      if (/\bOR\b/i.test(inner)) {
        result.anyOfTheseWords = inner.replace(/\s+OR\s+/gi, ' ');
      } else if (/\bAND\b/i.test(inner)) {
        result.allOfTheseWords = inner.replace(/\s+AND\s+/gi, ' ');
      } else {
        result.allOfTheseWords = result.allOfTheseWords
          ? `${result.allOfTheseWords} ${inner}`
          : inner;
      }
    });
  }

  return result;
}

/**
 * Build a boolean query string from the four editable fields, for submission
 * as the `search` filter (the backend auto-detects AND/OR/NOT/IS/() as advanced syntax).
 */
export function buildAdvancedSearchQuery(fields: AdvancedSearchFields): string {
  const allOfTheseWords = fields.allOfTheseWords.trim().replace(/\s+/g, ' AND ');
  const anyOfTheseWords = fields.anyOfTheseWords.trim().replace(/\s+/g, ' OR ');
  const noneOfTheseWords = fields.noneOfTheseWords.trim().replace(/\s+/g, ' AND ');
  const author = fields.author.trim();

  let searchQuery = '';

  if (allOfTheseWords) searchQuery += `( ${allOfTheseWords} )`;
  if (anyOfTheseWords) searchQuery += `( ${anyOfTheseWords} )`;
  if (noneOfTheseWords) searchQuery += ` NOT ( ${noneOfTheseWords} )`;
  if (author) searchQuery += `( AUTHOR IS ${author} )`;

  return searchQuery.split(')(').join(') AND (');
}
