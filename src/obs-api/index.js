exports.__esModule = true;
const obs = require('obs-studio-node');

/* Use for...in operator to perfectly mirror the osn module */
for (const entry in obs) {
  exports[entry] = obs[entry];
}
