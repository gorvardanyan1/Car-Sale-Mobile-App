import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  promptAsyncMock,
  exchangeCodeAsyncMock,
  makeRedirectUriMock,
  authRequestCtor,
  platform,
  constants,
} = vi.hoisted(() => ({
  promptAsyncMock: vi.fn(),
  exchangeCodeAsyncMock: vi.fn(),
  makeRedirectUriMock: vi.fn(() => 'car-sale-rn://oauthredirect'),
  authRequestCtor: vi.fn(),
  platform: { OS: 'ios' as string },
  // Populated only by Expo Go; null in our own binary.
  constants: { expoGoConfig: null as unknown },
}));

vi.mock('expo-constants', () => ({ default: constants }));

vi.mock('react-native', () => ({
  Platform: platform,
}));

vi.mock('expo-auth-session', () => ({
  AuthRequest: class {
    codeVerifier = 'test-code-verifier';

    constructor(config: unknown) {
      authRequestCtor(config);
    }

    promptAsync = promptAsyncMock;
  },
  exchangeCodeAsync: exchangeCodeAsyncMock,
  makeRedirectUri: makeRedirectUriMock,
  ResponseType: { Code: 'code' },
  CodeChallengeMethod: { S256: 'S256' },
}));

const IOS_CLIENT_ID = '678182909036-iosabc.apps.googleusercontent.com';

let env: Record<string, string | undefined> = {};

vi.mock('@/lib/env/publicEnv', () => ({
  readPublicEnv: (key: string) => env[key],
}));

const importModule = async () => import('@/lib/auth/googleAuth');

describe('googleAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    platform.OS = 'ios';
    constants.expoGoConfig = null;
    env = { EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: IOS_CLIENT_ID };
    exchangeCodeAsyncMock.mockResolvedValue({ idToken: 'google.id.token' });
    promptAsyncMock.mockResolvedValue({ type: 'success', params: { code: 'auth-code-abc' } });
  });

  // ------------------------------------------------------------ configuration

  it('picks the platform client id, falling back to the web one', async () => {
    const { getGoogleClientId } = await importModule();
    expect(getGoogleClientId()).toBe(IOS_CLIENT_ID);

    platform.OS = 'android';
    env = { EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'android-id.apps.googleusercontent.com' };
    expect(getGoogleClientId()).toBe('android-id.apps.googleusercontent.com');

    platform.OS = 'web';
    env = { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id.apps.googleusercontent.com' };
    expect(getGoogleClientId()).toBe('web-id.apps.googleusercontent.com');
  });

  it('reports itself unconfigured when the build shipped without client ids', async () => {
    env = {};
    const { isGoogleAuthConfigured } = await importModule();

    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it('refuses to start a flow with no client id, without opening a browser', async () => {
    env = {};
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({
      type: 'error',
      code: 'not_configured',
    });
    expect(promptAsyncMock).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------------- expo go

  /**
   * Google authorises the *calling app* by package/bundle id and signature. In
   * Expo Go that is Expo's own client, not ours, so Google refuses the request
   * with "Access blocked: this request is invalid" before an account can be
   * picked. Offering the button there is offering a dead end.
   */
  it('reports itself unconfigured inside Expo Go, however complete the client ids are', async () => {
    constants.expoGoConfig = { debuggerHost: '192.168.0.118:8081' };
    const { isGoogleAuthConfigured, isExpoGo } = await importModule();

    expect(isExpoGo()).toBe(true);
    expect(isGoogleAuthConfigured()).toBe(false);
  });

  it('refuses to open a browser inside Expo Go rather than land on a Google error page', async () => {
    constants.expoGoConfig = { debuggerHost: '192.168.0.118:8081' };
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({
      type: 'error',
      code: 'not_configured',
    });
    expect(promptAsyncMock).not.toHaveBeenCalled();
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  it('runs normally in a development build, where expoGoConfig is absent', async () => {
    constants.expoGoConfig = null;
    const { isGoogleAuthConfigured, isExpoGo, signInWithGoogleAsync } = await importModule();

    expect(isExpoGo()).toBe(false);
    expect(isGoogleAuthConfigured()).toBe(true);
    await expect(signInWithGoogleAsync()).resolves.toEqual({
      type: 'success',
      idToken: 'google.id.token',
    });
  });

  // -------------------------------------------------------------- redirect uri

  it('uses the reversed client id scheme on native, which is all Google accepts', async () => {
    const { buildRedirectUri } = await importModule();

    expect(buildRedirectUri(IOS_CLIENT_ID)).toBe(
      'com.googleusercontent.apps.678182909036-iosabc:/oauthredirect',
    );
  });

  it('falls back to the app scheme on web, where there is no native client', async () => {
    platform.OS = 'web';
    const { buildRedirectUri } = await importModule();

    expect(buildRedirectUri('web-id.apps.googleusercontent.com')).toBe(
      'car-sale-rn://oauthredirect',
    );
    expect(makeRedirectUriMock).toHaveBeenCalledWith({
      scheme: 'car-sale-rn',
      path: 'oauthredirect',
    });
  });

  // ------------------------------------------------------------- request shape

  it('requests only identity scopes, over PKCE, with no client secret', async () => {
    const { signInWithGoogleAsync } = await importModule();

    await signInWithGoogleAsync();

    const config = authRequestCtor.mock.calls[0][0];

    expect(config.scopes).toEqual(['openid', 'email', 'profile']);
    expect(config.usePKCE).toBe(true);
    expect(config.codeChallengeMethod).toBe('S256');
    expect(config.responseType).toBe('code');
    expect(config.clientId).toBe(IOS_CLIENT_ID);
    // A native client is a public client — shipping a secret in the app would
    // be handing it to anyone who unzips the binary.
    expect(config.clientSecret).toBeUndefined();
  });

  it('sends the PKCE verifier on the token exchange and no secret', async () => {
    const { signInWithGoogleAsync } = await importModule();

    await signInWithGoogleAsync();

    const [exchangeConfig, discovery] = exchangeCodeAsyncMock.mock.calls[0];

    expect(exchangeConfig.code).toBe('auth-code-abc');
    expect(exchangeConfig.extraParams).toEqual({ code_verifier: 'test-code-verifier' });
    expect(exchangeConfig.clientSecret).toBeUndefined();
    expect(discovery.tokenEndpoint).toBe('https://oauth2.googleapis.com/token');
  });

  // ------------------------------------------------------------------ outcomes

  it('returns the id token on success', async () => {
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({
      type: 'success',
      idToken: 'google.id.token',
    });
  });

  it.each(['cancel', 'dismiss'])('reports a %s as cancelled, not an error', async (type) => {
    promptAsyncMock.mockResolvedValueOnce({ type });
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({ type: 'cancelled' });
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  it('does not attempt an exchange when Google returned no code', async () => {
    promptAsyncMock.mockResolvedValueOnce({ type: 'success', params: {} });
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({ type: 'error', code: 'unknown' });
    expect(exchangeCodeAsyncMock).not.toHaveBeenCalled();
  });

  it('reports a rejected token exchange without leaking provider detail', async () => {
    exchangeCodeAsyncMock.mockRejectedValueOnce(
      new Error('invalid_grant: code was already redeemed for ya29.SECRET'),
    );
    const { signInWithGoogleAsync } = await importModule();

    const result = await signInWithGoogleAsync();

    expect(result).toEqual({ type: 'error', code: 'exchange_failed' });
    // The raw provider error can reach a crash report; it must not carry a
    // credential with it.
    expect(JSON.stringify(result)).not.toContain('ya29');
  });

  it('reports a token response with no id token', async () => {
    exchangeCodeAsyncMock.mockResolvedValueOnce({ accessToken: 'ya29.token' });
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({
      type: 'error',
      code: 'no_id_token',
    });
  });

  it('survives the browser throwing rather than resolving', async () => {
    promptAsyncMock.mockRejectedValueOnce(new Error('activity destroyed'));
    const { signInWithGoogleAsync } = await importModule();

    await expect(signInWithGoogleAsync()).resolves.toEqual({ type: 'error', code: 'unknown' });
  });
});
