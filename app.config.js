/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

/**
 * EAS Build reads EXPO_PUBLIC_* from eas.json `env` (or local .env in dev).
 * We also copy them into `extra` so release builds can read them via expo-constants
 * when Metro does not inline process.env (common cause of "Cannot reach API" on device).
 */
/**
 * Returns the API host to allow cleartext (HTTP) traffic for, or null when the
 * API is already served over https:// and no exception should exist at all.
 */
function insecureApiHost(apiUrl) {
  if (!apiUrl) {
    return null;
  }

  try {
    const parsed = new URL(apiUrl);

    return parsed.protocol === 'http:' ? parsed.hostname : null;
  } catch {
    return null;
  }
}

module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
  const chatUrl = process.env.EXPO_PUBLIC_CHAT_URL?.trim() || '';
  const mobileAppSecret = process.env.EXPO_PUBLIC_MOBILE_APP_SECRET?.trim() || '';
  const apiHost = insecureApiHost(apiUrl);

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      chatUrl,
      mobileAppSecret,
    },
    plugins: [
      ...(appJson.expo.plugins ?? []),
      [
        'expo-build-properties',
        {
          android: {
            usesCleartextTraffic: false,
          },
        },
      ],
      ['./plugins/withAndroidCleartext.js', { apiHost }],
    ],
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        // HTTPS is required everywhere except the current API host below, ONLY
        // when it's still http:// (see insecureApiHost() above). This is the
        // scoped equivalent of Android's network_security_config.xml — do NOT
        // replace with NSAllowsArbitraryLoads, which disables ATS for every host.
        // Once EXPO_PUBLIC_API_URL is https://, this exception disappears on
        // its own and no code here needs to change.
        NSAppTransportSecurity: {
          NSAllowsLocalNetworking: true,
          ...(apiHost
            ? {
                NSExceptionDomains: {
                  [apiHost]: {
                    NSExceptionAllowsInsecureHTTPLoads: true,
                    NSIncludesSubdomains: false,
                  },
                },
              }
            : {}),
        },
      },
    },
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: false,
    },
  };
};
