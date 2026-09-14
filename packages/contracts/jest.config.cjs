module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@stokku/domain$': '<rootDir>/../domain/src/index.ts',
    '^@stokku/validation$': '<rootDir>/../validation/src/index.ts',
  },
};
