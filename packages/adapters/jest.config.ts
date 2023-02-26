import type { Config } from '@jest/types';

const esModules = ['@ngrx', '@angular'].join('|');

const config: Config.InitialOptions = {
  coverageReporters: [
    'text'
  ],
  preset: "ts-jest/presets/js-with-ts-esm",
  roots: ['<rootDir>'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'mjs'],
  testTimeout: 10000,
  setupFiles: ["./tests/jest.setup.ts"],
  setupFilesAfterEnv: ['./tests/setup-angular.ts'],
  globalSetup: 'jest-preset-angular/global-setup',
  transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
  collectCoverageFrom: [
    'src/**'
  ],
};

export default config;