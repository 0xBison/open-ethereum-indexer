const defaultConfig = require('./jest.config');

module.exports = {
  ...defaultConfig,
  testMatch: ['<rootDir>/**/*.test-e2e.ts'],
  testTimeout: 30000,
};
