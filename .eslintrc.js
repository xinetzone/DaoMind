module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  rules: {
    // 公共导出必须以 dao 为前缀
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'exported',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
        filter: {
          regex: '^dao[A-Z]',
          match: true,
        },
        custom: {
          regex: '^dao',
          match: false,
          message: '公共导出名称必须以 "dao" 为前缀',
        },
      },
    ],
    // 其他规则
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  env: {
    es2022: true,
    node: true,
  },
}
