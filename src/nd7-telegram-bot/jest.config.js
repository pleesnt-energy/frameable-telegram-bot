/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest', // Use ts-jest for TypeScript testing
  testEnvironment: 'node', // Use Node.js testing environment
  modulePathIgnorePatterns: ["<rootDir>/dist/"], // Ignore build artifacts
  transform: {
      '^.+\\.ts?$': 'ts-jest', // Process .ts and .tsx files with ts-jest
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
};