/*
 * For reference:
 * https://eslint.org/docs/user-guide/configuring
 */

module.exports = {
  env: {
    browser: true,
    es6: true,
    mocha: true,
    node: false,
  },

  extends: [
    'eslint:recommended',
    'prettier',
    'plugin:eslint-comments/recommended',
    'plugin:promise/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  globals: {},

  overrides: [
    {
      env: {
        node: true,
      },

      files: ['./config/**/*.js', './scripts/**/*.js', './babel.config.js', './.eslintrc.js'],
    },

    {
      files: ['./**/*.spec.*', './**/specs/**/*'],

      globals: {
        expect: 'writable',
      },
    },
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaFeatures: {
      jsx: false,
    },

    ecmaVersion: 2018,
    sourceType: 'module',
  },

  plugins: ['import', 'prettier', 'promise', 'mocha'],
  root: true,

  rules: {
    '@typescript-eslint/no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    '@typescript-eslint/no-var-requires': 'off',
    'arrow-body-style': 'off',
    'eslint-comments/no-unused-disable': 'error',
    'import/extensions': ['error', 'ignorePackages', {js: 'never', ts: 'never'}],
    'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
    'no-unused-vars': 'off',
    'prefer-arrow-callback': 'off',
    'prettier/prettier': 'error',
  },

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },

    'import/resolver': {
      typescript: {},
    },
  },
}
