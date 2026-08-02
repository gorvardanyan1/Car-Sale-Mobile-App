import { describe, expect, it } from 'vitest';

import { am } from '../locales/am';
import { en } from '../locales/en';
import { ru } from '../locales/ru';

const KEYS = [
  'dealer.directory_title',
  'dealer.view_profile',
  'dealer.message',
  'mobile.list.browse_dealers',
  'dealer.edit_profile',
  'dealer.phone',
  'dealer.website',
  'dealer.location',
  'dealer.facebook',
  'dealer.twitter',
  'dealer.instagram',
  'dealer.cover_image',
  'dealer.day',
  'dealer.hours',
  'dealer.add_specialization',
  'dealer.get_verified_badge',
  'dealer.verification_modal_title',
  'dealer.verification_modal_body',
  'dealer.verification_modal_body_subscription',
  'dealer.verification_benefits_title',
  'dealer.verification_benefit_1',
  'dealer.verification_benefit_2',
  'dealer.verification_benefit_3',
  'dealer.verification_benefit_4',
  'dealer.verification_payment_error',
  'dealer.verification_unavailable',
  'dealer.verification_redirecting',
  'dealer.follow',
  'dealer.following',
  'dealer.followers',
  'dealer.followers_title',
  'dealer.followers_count',
  'dealer.followers_member_since',
  'dealer.followers_empty_title',
  'dealer.followers_empty_hint',
] as const;

describe('dealer locale keys', () => {
  it.each(KEYS)('defines %s in all locales', (key) => {
    expect(en[key]).toBeTruthy();
    expect(ru[key]).toBeTruthy();
    expect(am[key]).toBeTruthy();
  });
});
