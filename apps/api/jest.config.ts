import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@stokku/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@stokku/domain$': '<rootDir>/../../packages/domain/src/index.ts',
    '^@stokku/validation$': '<rootDir>/../../packages/validation/src/index.ts',
  },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/**/index.ts'],
};

export default config;
