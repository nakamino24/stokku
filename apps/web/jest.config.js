module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/.next/'],
  passWithNoTests: true,
};