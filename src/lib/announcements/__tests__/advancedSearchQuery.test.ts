import { describe, expect, it } from 'vitest';

import {
  buildAdvancedSearchQuery,
  emptyAdvancedSearchFields,
  hasAdvancedSearchFields,
  parseAdvancedSearchQuery,
} from '@/lib/announcements/advancedSearchQuery';

describe('buildAdvancedSearchQuery', () => {
  it('returns an empty string when every field is blank', () => {
    expect(buildAdvancedSearchQuery(emptyAdvancedSearchFields())).toBe('');
  });

  it('treats whitespace-only fields as blank', () => {
    expect(
      buildAdvancedSearchQuery({
        allOfTheseWords: '   ',
        anyOfTheseWords: '\t',
        noneOfTheseWords: '  ',
        author: ' ',
      }),
    ).toBe('');
  });

  it('joins multiple "all of these words" with AND', () => {
    const query = buildAdvancedSearchQuery({
      ...emptyAdvancedSearchFields(),
      allOfTheseWords: 'Mercedes reliable',
    });

    expect(query).toBe('( Mercedes AND reliable )');
  });

  it('joins multiple "any of these words" with OR', () => {
    const query = buildAdvancedSearchQuery({
      ...emptyAdvancedSearchFields(),
      anyOfTheseWords: 'BMW Mercedes Audi',
    });

    expect(query).toBe('( BMW OR Mercedes OR Audi )');
  });

  it('wraps "none of these words" in a NOT clause joined with AND', () => {
    const query = buildAdvancedSearchQuery({
      ...emptyAdvancedSearchFields(),
      noneOfTheseWords: 'damaged accident salvage',
    });

    expect(query).toBe(' NOT ( damaged AND accident AND salvage )');
  });

  it('builds an AUTHOR IS clause', () => {
    const query = buildAdvancedSearchQuery({
      ...emptyAdvancedSearchFields(),
      author: 'john_dealer123',
    });

    expect(query).toBe('( AUTHOR IS john_dealer123 )');
  });

  it('combines all four fields, collapsing adjacent parens into AND', () => {
    const query = buildAdvancedSearchQuery({
      allOfTheseWords: 'luxury sedan',
      anyOfTheseWords: 'BMW Mercedes',
      noneOfTheseWords: 'damaged',
      author: 'john_dealer123',
    });

    expect(query).toBe(
      '( luxury AND sedan ) AND ( BMW OR Mercedes ) NOT ( damaged ) AND ( AUTHOR IS john_dealer123 )',
    );
  });

  it('ignores leading/trailing whitespace in each field', () => {
    const query = buildAdvancedSearchQuery({
      allOfTheseWords: '  Mercedes  ',
      anyOfTheseWords: '',
      noneOfTheseWords: '',
      author: '  jon  ',
    });

    expect(query).toBe('( Mercedes ) AND ( AUTHOR IS jon )');
  });
});

describe('parseAdvancedSearchQuery', () => {
  it('returns empty fields for an empty or blank query', () => {
    expect(parseAdvancedSearchQuery('')).toEqual(emptyAdvancedSearchFields());
    expect(parseAdvancedSearchQuery('   ')).toEqual(emptyAdvancedSearchFields());
  });

  it('extracts the author clause case-insensitively', () => {
    const fields = parseAdvancedSearchQuery('( author is john_dealer123 )');
    expect(fields.author).toBe('john_dealer123');
  });

  it('extracts a NOT clause into noneOfTheseWords, dropping AND joiners', () => {
    const fields = parseAdvancedSearchQuery('NOT ( damaged AND accident AND salvage )');
    expect(fields.noneOfTheseWords).toBe('damaged accident salvage');
  });

  it('extracts an OR group into anyOfTheseWords', () => {
    const fields = parseAdvancedSearchQuery('( BMW OR Mercedes OR Audi )');
    expect(fields.anyOfTheseWords).toBe('BMW Mercedes Audi');
  });

  it('extracts an AND group into allOfTheseWords', () => {
    const fields = parseAdvancedSearchQuery('( luxury AND sedan )');
    expect(fields.allOfTheseWords).toBe('luxury sedan');
  });

  it('parses a full combined query back into its four fields', () => {
    const built = buildAdvancedSearchQuery({
      allOfTheseWords: 'luxury sedan',
      anyOfTheseWords: 'BMW Mercedes',
      noneOfTheseWords: 'damaged',
      author: 'john_dealer123',
    });

    const fields = parseAdvancedSearchQuery(built);

    expect(fields).toEqual({
      allOfTheseWords: 'luxury sedan',
      anyOfTheseWords: 'BMW Mercedes',
      noneOfTheseWords: 'damaged',
      author: 'john_dealer123',
    });
  });

  it('treats a bare-word group with no AND/OR as part of allOfTheseWords', () => {
    const fields = parseAdvancedSearchQuery('( Mercedes )');
    expect(fields.allOfTheseWords).toBe('Mercedes');
  });
});

describe('hasAdvancedSearchFields', () => {
  it('is false when every field is blank', () => {
    expect(hasAdvancedSearchFields(emptyAdvancedSearchFields())).toBe(false);
    expect(
      hasAdvancedSearchFields({
        allOfTheseWords: '  ',
        anyOfTheseWords: '',
        noneOfTheseWords: '',
        author: '',
      }),
    ).toBe(false);
  });

  it('is true when any single field has content', () => {
    expect(
      hasAdvancedSearchFields({ ...emptyAdvancedSearchFields(), author: 'jon' }),
    ).toBe(true);
    expect(
      hasAdvancedSearchFields({ ...emptyAdvancedSearchFields(), noneOfTheseWords: 'salvage' }),
    ).toBe(true);
  });
});
