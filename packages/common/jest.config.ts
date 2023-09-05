import { jsWithTsESM as tsjPreset } from 'ts-jest/presets';

import type { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  coverageReporters: [
    'text'
  ],
  roots: ['<rootDir>'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  testPathIgnorePatterns: [
    "<rootDir>/tests/plugins/enhancers" 
  ],
  moduleFileExtensions: ['ts', 'js'],
  testTimeout: 10000,
  setupFiles: ["./tests/jest.setup.ts"],
  collectCoverageFrom: [
    'src/**'
  ],
  transform: {
    ...tsjPreset.transform,
  }
};

export default config;