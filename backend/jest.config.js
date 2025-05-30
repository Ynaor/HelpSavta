module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/src/__tests__/setup.ts',
    '<rootDir>/src/__tests__/globalSetup.ts',
    '<rootDir>/src/__tests__/globalTeardown.ts',
    '<rootDir>/src/routes/',
    '<rootDir>/src/services/',
    '<rootDir>/src/scripts/',
    '<rootDir>/src/middleware/',
    '<rootDir>/src/config/',
    '<rootDir>/src/utils/',
    '<rootDir>/src/types/'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/**/__tests__/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000,
  globalSetup: '<rootDir>/src/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/src/__tests__/globalTeardown.ts'
};