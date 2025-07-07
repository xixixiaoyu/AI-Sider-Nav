/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  ignorePatterns: ['public/**/*.js', 'public/**/*.min.js', 'public/libs/**/*'],
  rules: {
    // 自定义规则
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-unused-vars': 'off', // 使用 TypeScript 版本
  },
}
