module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/../tests/backend'],
  testMatch: [
    '**/tests/backend/**/*.test.ts',
    '**/__tests__/**/*.ts',
    '**/*.spec.ts',
    '**/*.test.ts'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/src/routes/test.ts',
    '<rootDir>/../tests/backend/setup.ts',
    '<rootDir>/../tests/backend/globalSetup.ts',
    '<rootDir>/../tests/backend/globalTeardown.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  modulePaths: [
    '<rootDir>/node_modules',
    '<rootDir>/../node_modules',
    '<rootDir>/../tests/node_modules'
  ],
  resolver: undefined,
  moduleDirectories: ['node_modules', '../node_modules', '../tests/node_modules'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!**/tests/**'
  ],
  coverageDirectory: '../tests/backend/coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/../tests/backend/setup.ts'],
  testTimeout: 10000,
  globalSetup: '<rootDir>/../tests/backend/globalSetup.ts',
  globalTeardown: '<rootDir>/../tests/backend/globalTeardown.ts'
};