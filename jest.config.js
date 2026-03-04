module.exports = {
  projects: [
    // Unit tests - pure business logic, no React Native runtime needed
    {
      displayName: 'unit',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^react-native$': '<rootDir>/tests/__mocks__/react-native.ts',
      },
      setupFiles: ['<rootDir>/tests/setup.ts'],
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    // Integration tests - cross-module interactions
    {
      displayName: 'integration',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^react-native$': '<rootDir>/tests/__mocks__/react-native.ts',
      },
      setupFiles: ['<rootDir>/tests/setup.ts'],
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    },
    // Component tests - React component rendering with @testing-library/react-native
    {
      displayName: 'component',
      testEnvironment: 'node',
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^react-native$': '<rootDir>/tests/__mocks__/react-native.ts',
      },
      setupFiles: ['<rootDir>/tests/setup.ts'],
      testMatch: ['<rootDir>/tests/component/**/*.test.tsx'],
    },
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**',
  ],
};
