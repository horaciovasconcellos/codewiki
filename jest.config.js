export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/src/**/*.js',
    '!server/src/tests/**',
    '!server/src/app.js'
  ],
  testMatch: [
    '**/server/src/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/server/src/tests/setup.js'],
  transform: {},
  testTimeout: 10000,
  verbose: true
};
