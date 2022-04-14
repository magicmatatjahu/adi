module.exports = {
  coverageReporters: [
    'json',
    'lcov',
    'text'
  ],
  preset: 'ts-jest',
  testEnvironment: "jsdom",
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFiles: ["./tests/jest.setup.ts"],
  testTimeout: 1000,
};
