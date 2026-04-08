module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/**/src/**/*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).ts',
    '**/*.test.ts',
    '**/*.spec.ts'
  ],
  moduleNameMapper: {
    '^@daomind/agents$': '<rootDir>/packages/daoAgents/src',
    '^@daomind/apps$': '<rootDir>/packages/daoApps/src',
    '^@daomind/verify$': '<rootDir>/packages/daoVerify/src',
    '^@daomind/(.*)$': '<rootDir>/packages/dao$1/src',
    '^../../packages/(.*)$': '<rootDir>/packages/$1'
  },
  roots: [
    '<rootDir>/packages',
    '<rootDir>/src'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true
    }]
  },
  modulePaths: [
    '<rootDir>/packages',
    '<rootDir>/src'
  ],
  moduleDirectories: [
    'node_modules',
    'packages',
    'src'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};