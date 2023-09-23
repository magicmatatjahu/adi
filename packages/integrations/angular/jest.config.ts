export default {
  displayName: '@adi/angular',
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

// import type { Config } from '@jest/types';

// const config: Config.InitialOptions = {
//   roots: ['<rootDir>'],
//   preset: "jest-preset-angular",
//   setupFiles: ["./tests/setup-angular.ts"],
// };

// export default config;

// import type { Config } from '@jest/types';

// const esModules = ['@angular'].join('|');

// const config: Config.InitialOptions = {
//   coverageReporters: [
//     'text'
//   ],
//   preset: "jest-preset-angular",
//   testEnvironment: 'jsdom',
//   roots: ['<rootDir>'],
//   testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
//   moduleFileExtensions: ['ts', 'js'],
//   testTimeout: 10000,
//   setupFiles: ["./tests/jest.setup.ts"],
//   setupFilesAfterEnv: ['./tests/setup-angular.ts'],
//   globalSetup: 'jest-preset-angular/global-setup',
//   transformIgnorePatterns: [`/node_modules/(?!${esModules})`],
//   collectCoverageFrom: [
//     'src/**'
//   ],
// };

// export default config;