/** @type {import('expo/config').ExpoConfig} */
const appJson = require('./app.json');

/**
 * EAS Build reads EXPO_PUBLIC_* from eas.json `env` (or local .env in dev).
 * We also copy them into `extra` so release builds can read them via expo-constants
 * when Metro does not inline process.env (common cause of "Cannot reach API" on device).
 */
module.exports = () => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
  const chatUrl = process.env.EXPO_PUBLIC_CHAT_URL?.trim() || '';

  return {
    ...appJson.expo,
    extra: {
      ...appJson.expo.extra,
      apiUrl,
      chatUrl,
    },
    ios: {
      ...appJson.expo.ios,
      infoPlist: {
        ...appJson.expo.ios?.infoPlist,
        // Allow HTTP to production IP (NSAllowsLocalNetworking alone only covers LAN).
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true,
        },
      },
    },
    android: {
      ...appJson.expo.android,
      usesCleartextTraffic: true,
    },
  };
};
