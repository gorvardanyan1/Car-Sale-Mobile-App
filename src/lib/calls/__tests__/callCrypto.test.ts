import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { x25519 } from '@noble/curves/ed25519.js';

import {
  deriveCallSecrets,
  formatVerificationCode,
  fromBase64,
  generateCallKeyPair,
  toBase64,
} from '@/lib/calls/callCrypto';

const CALL_ID = '64b7f0c2c2a4e1eeeeeeeeee';
const A_PRIVATE = new Uint8Array(32).fill(1);
const B_PRIVATE = new Uint8Array(32).fill(2);
const pub = (k: Uint8Array) => toBase64(x25519.getPublicKey(k));
const random = (n: number) => new Uint8Array(randomBytes(n));

describe('callCrypto', () => {
  // The web app's callCrypto test pins these exact values: a phone ↔ browser
  // call only decrypts if both platforms derive byte-identical keys.
  it('matches the cross-platform test vector', () => {
    expect(pub(A_PRIVATE)).toBe('pOCSkrZRwni5dyxWn1+puxPZBrRqtoyd+dwrRAn4ogk=');
    expect(pub(B_PRIVATE)).toBe('zo060cy2M+x7cMF4FKXHbs0CloUFDTRHRboFhw5YfVk=');

    expect(deriveCallSecrets(A_PRIVATE, pub(B_PRIVATE), CALL_ID)).toEqual({
      mediaKey: 'ELWvV/N17uvVpoNIbzdAkShTTmMQWfFYoQHH/wu/uDw=',
      verificationCode: '853338',
    });
  });

  it('gives both sides the same key and code', () => {
    const caller = generateCallKeyPair(random);
    const callee = generateCallKeyPair(random);

    const a = deriveCallSecrets(caller.privateKey, callee.publicKey, CALL_ID);
    const b = deriveCallSecrets(callee.privateKey, caller.publicKey, CALL_ID);

    expect(a).toEqual(b);
    expect(fromBase64(a.mediaKey)).toHaveLength(32);
    expect(a.verificationCode).toMatch(/^\d{6}$/);
  });

  it('shows different codes when someone substitutes their own key', () => {
    const caller = generateCallKeyPair(random);
    const callee = generateCallKeyPair(random);
    const attacker = generateCallKeyPair(random);

    const callerView = deriveCallSecrets(caller.privateKey, attacker.publicKey, CALL_ID);
    const calleeView = deriveCallSecrets(callee.privateKey, attacker.publicKey, CALL_ID);

    expect(callerView.verificationCode).not.toBe(calleeView.verificationCode);
  });

  it('refuses a random source that returns the wrong length and a malformed peer key', () => {
    expect(() => generateCallKeyPair(() => new Uint8Array(16))).toThrow();
    expect(() => deriveCallSecrets(A_PRIVATE, btoa('short'), CALL_ID)).toThrow('Invalid peer public key');
  });

  it('formats the code in two groups', () => {
    expect(formatVerificationCode('853338')).toBe('853 338');
    expect(formatVerificationCode(null)).toBe('');
  });
});
