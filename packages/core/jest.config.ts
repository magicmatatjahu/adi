import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  coverageReporters: [
    'text'
  ],
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 10000,
  setupFiles: ["./tests/jest.setup.ts"],
  collectCoverageFrom: [
    'src/**'
  ],
};

export default config;