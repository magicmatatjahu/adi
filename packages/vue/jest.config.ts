import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  coverageReporters: [
    'text'
  ],
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'js', 'tsx', 'jsx'],
  testTimeout: 10000,
  setupFiles: ["./tests/jest.setup.ts"],
  collectCoverageFrom: [
    'src/**'
  ],
};

export default config;