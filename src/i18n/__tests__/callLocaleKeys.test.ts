import { describe, expect, it } from 'vitest';

import { en } from '../locales/en';
import { ru } from '../locales/ru';
import { am } from '../locales/am';
import { outcomeMessageKey } from '@/lib/calls/callState';

/** Every key the call UI resolves, including each outcome message. */
const REQUIRED_KEYS = [
  'mobile.call.start_voice',
  'mobile.call.start_video',
  'mobile.call.incoming_voice',
  'mobile.call.incoming_video',
  'mobile.call.accept',
  'mobile.call.decline',
  'mobile.call.hang_up',
  'mobile.call.cancel',
  'mobile.call.mute',
  'mobile.call.unmute',
  'mobile.call.speaker_on',
  'mobile.call.speaker_off',
  'mobile.call.camera_on',
  'mobile.call.camera_off',
  'mobile.call.switch_camera',
  'mobile.call.minimize',
  'mobile.call.expand',
  'mobile.call.ringing',
  'mobile.call.connecting',
  'mobile.call.reconnecting',
  'mobile.call.unknown_peer',
  'mobile.call.e2ee_label',
  'mobile.call.e2ee_hint',
  'mobile.call.transport_encrypted',
  'mobile.call.weak_connection',
  'mobile.call.history_voice',
  'mobile.call.history_video',
  'mobile.call.history_missed_voice',
  'mobile.call.history_missed_video',
  'mobile.call.history_no_answer',
  'mobile.call.history_declined',
  'mobile.call.history_you_declined',
  'mobile.call.history_failed',
];

const OUTCOME_KEYS = [
  outcomeMessageKey(null, 'out'),
  outcomeMessageKey({ error: 'Busy' }, 'out'),
  outcomeMessageKey({ error: 'permission_denied' }, 'out'),
  outcomeMessageKey({ error: 'Calls disabled' }, 'out'),
  outcomeMessageKey({ error: 'Rate limit exceeded' }, 'out'),
  outcomeMessageKey({ error: 'Timeout' }, 'out'),
  outcomeMessageKey({ status: 'declined' }, 'out'),
  outcomeMessageKey({ status: 'missed', reason: 'timeout' }, 'out'),
  outcomeMessageKey({ status: 'missed', reason: 'timeout' }, 'in'),
  outcomeMessageKey({ status: 'accepted', reason: 'answered_elsewhere' }, 'in'),
  outcomeMessageKey({ status: 'ended', reason: 'peer_left' }, 'out'),
];

describe('call locale keys', () => {
  it.each([
    ['en', en],
    ['ru', ru],
    ['am', am],
  ] as const)('%s has a non-empty string for every call key and outcome', (_lang, locale) => {
    const dict = locale as Record<string, string>;
    for (const key of [...REQUIRED_KEYS, ...OUTCOME_KEYS]) {
      expect(typeof dict[key], key).toBe('string');
      expect(dict[key].trim().length, key).toBeGreaterThan(0);
    }
  });

  it('is actually translated, not copied from English', () => {
    expect((ru as Record<string, string>)['mobile.call.accept']).not.toBe(
      (en as Record<string, string>)['mobile.call.accept'],
    );
    expect((am as Record<string, string>)['mobile.call.accept']).not.toBe(
      (en as Record<string, string>)['mobile.call.accept'],
    );
  });
});
