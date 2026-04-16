export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: false,
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
    '^@daomind/monitor$': '<rootDir>/packages/daoMonitor/src',
    '^@daomind/anything$': '<rootDir>/packages/daoAnything/src',
    '^@daomind/nothing$': '<rootDir>/packages/daoNothing/src',
    '^@daomind/chronos$': '<rootDir>/packages/daoChronos/src',
    '^@daomind/nexus$': '<rootDir>/packages/daoNexus/src',
    '^@daomind/pages$': '<rootDir>/packages/daoPages/src',
    '^@daomind/feedback$': '<rootDir>/packages/daoFeedback/src',
    '^@daomind/docs$': '<rootDir>/packages/daoDocs/src',
    '^@daomind/skills$': '<rootDir>/packages/daoSkilLs/src',
    '^@daomind/spaces$': '<rootDir>/packages/daoSpaces/src',
    '^@daomind/collective$': '<rootDir>/packages/daoCollective/src',
    '^@daomind/benchmark$': '<rootDir>/packages/daoBenchmark/src',
    '^@modulux/qi$': '<rootDir>/packages/daoQi/src',
    '^@daomind/qi$': '<rootDir>/packages/daoQi/src',
    '^@daomind/times$': '<rootDir>/packages/daotimes/src',
    '^@daomind/(.*)$': '<rootDir>/packages/dao$1/src',
    '^../../packages/(.*)$': '<rootDir>/packages/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  roots: [
    '<rootDir>/packages',
    '<rootDir>/src',
    '<rootDir>/tests'
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
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  maxWorkers: '50%',
  testTimeout: 30000,
  forceExit: true
};