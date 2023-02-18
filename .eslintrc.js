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
      files: ['./**/*.spec.js', './**/specs/**/*.js'],

      globals: {
        expect: 'writable',
      },
    },
  ],

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
    'eslint-comments/no-unused-disable': 'error',
    'import/extensions': ['error', 'ignorePackages', {js: 'never'}],
    'import/no-extraneous-dependencies': ['error', {devDependencies: true}],
    'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
    'prettier/prettier': 'error',
    'arrow-body-style': 'off',
    'prefer-arrow-callback': 'off',
  },

  settings: {},
}
