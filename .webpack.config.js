module.exports = config => {
  config.target = 'electron-renderer';
  config.externals = {
    'obs-node': 'require(\'obs-node\')',
    'serialport': 'require(\'serialport\')',
    'segfault-handler': 'require(\'segfault-handler\')',
  };
  return config;
}
