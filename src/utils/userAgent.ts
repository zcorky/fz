const pkg = require('../../package.json');

const { name, version, repository } = pkg;
const userAgentName = name.replace('@', '').split('/').map(e => `${e[0].toUpperCase()}${e.slice(1)}`)[1];

export default function userAgent() {
  return `${userAgentName}/${version} (+${repository})`;
}
