import { x25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

/**
 * End-to-end encryption key agreement for calls.
 *
 * Each side makes a fresh X25519 key pair per call and sends only the public
 * half through the chat server. Both derive the same secret, which neither
 * the chat server (it only relays public keys) nor the LiveKit server (it
 * only forwards encrypted media) can compute.
 *
 * MUST stay byte-for-byte identical to the web app's resources/js/lib/callCrypto.js:
 * a phone user and a web user have to arrive at the same key and code. Both
 * test suites pin the same test vector to catch drift.
 */
const MEDIA_KEY_INFO = 'autohayq-call-e2ee-v1';
const SAS_INFO = 'autohayq-call-sas-v1';
const encoder = new TextEncoder();

export type CallKeyPair = { privateKey: Uint8Array; publicKey: string };
export type CallSecrets = { mediaKey: string; verificationCode: string };

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * @param randomBytes a CSPRNG — expo-crypto's getRandomBytes in the app.
 *   Injected because Hermes has no global crypto.getRandomValues.
 */
export function generateCallKeyPair(randomBytes: (size: number) => Uint8Array): CallKeyPair {
  const privateKey = randomBytes(32);
  if (privateKey.length !== 32) {
    throw new Error('Random source returned the wrong number of bytes');
  }
  return { privateKey, publicKey: toBase64(x25519.getPublicKey(privateKey)) };
}

/**
 * mediaKey: base64 key handed to LiveKit's key provider.
 * verificationCode: 6 digits both people can compare out loud — equal codes
 * mean nobody swapped the public keys in transit.
 */
export function deriveCallSecrets(
  privateKey: Uint8Array,
  peerPublicKey: string,
  callId: string,
): CallSecrets {
  const peer = fromBase64(peerPublicKey);
  if (peer.length !== 32) {
    throw new Error('Invalid peer public key');
  }

  const shared = x25519.getSharedSecret(privateKey, peer);
  const salt = encoder.encode(String(callId));

  const mediaKey = hkdf(sha256, shared, salt, encoder.encode(MEDIA_KEY_INFO), 32);
  const sas = hkdf(sha256, shared, salt, encoder.encode(SAS_INFO), 4);
  const code = (((sas[0] << 24) | (sas[1] << 16) | (sas[2] << 8) | sas[3]) >>> 0) % 1_000_000;

  return {
    mediaKey: toBase64(mediaKey),
    verificationCode: String(code).padStart(6, '0'),
  };
}

/** "853338" → "853 338", the way the plate on screen shows it. */
export function formatVerificationCode(code: string | null | undefined): string {
  return code ? `${code.slice(0, 3)} ${code.slice(3)}` : '';
}
