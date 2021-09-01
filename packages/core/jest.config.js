module.exports = {
  coverageReporters: [
    'json',
    'lcov',
    'text'
  ],
  preset: 'ts-jest',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.ts$',
  moduleFileExtensions: ['ts', 'js'],
  setupFiles: ["./tests/jest.setup.ts"],
  testTimeout: 1000,
};