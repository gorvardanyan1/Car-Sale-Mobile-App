const fs = require('node:fs');
const path = require('node:path');

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

// Always-safe local dev aliases: these never resolve off-device, so allowing
// cleartext to them carries no MITM/interception risk the way a routable
// IP or domain would.
const STATIC_DEV_HOSTS = ['localhost', '10.0.2.2'];

function buildNetworkSecurityXml(cleartextHosts) {
  const domainLines = cleartextHosts
    .map((host) => `    <domain includeSubdomains="false">${host}</domain>`)
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!--
    Cleartext (HTTP) is denied by default. It is permitted ONLY for the hosts
    below, so a compromised dependency, DNS-spoofing MITM, or misconfigured
    redirect can't make this app send tokens/payment data to an arbitrary host
    over plaintext. The API host is derived from EXPO_PUBLIC_API_URL at build
    time (see app.config.js); once that URL is https://, no exception is
    added here at all and this file only allows the static local-dev aliases.
  -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  <domain-config cleartextTrafficPermitted="true">
${domainLines}
  </domain-config>
</network-security-config>
`;
}

/**
 * Scope Android cleartext (HTTP) traffic to only the current build's API host
 * (when it's http://) plus static local-dev aliases, instead of allowing it
 * app-wide. Pass the plugin config as: ['./plugins/withAndroidCleartext.js', { apiHost }]
 * where apiHost is the hostname from EXPO_PUBLIC_API_URL, or omitted/null when
 * that URL is already https://.
 */
module.exports = function withAndroidCleartext(config, props = {}) {
  const cleartextHosts = [...STATIC_DEV_HOSTS, ...(props.apiHost ? [props.apiHost] : [])];

  config = withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:usesCleartextTraffic'] = 'false';
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });

  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const xmlDir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(
        path.join(xmlDir, 'network_security_config.xml'),
        buildNetworkSecurityXml(cleartextHosts),
        'utf8',
      );
      return cfg;
    },
  ]);
};
