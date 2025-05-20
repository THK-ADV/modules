module.exports = {
  root: true,

  // Use the TypeScript parser and allow .svelte files
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    extraFileExtensions: ['.svelte']
  },

  plugins: [
    '@typescript-eslint',
    'svelte'
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended'
  ],

  rules: {
    // turn off the no-at-html-tags rule globally
    'svelte/no-at-html-tags': 'off'
  },

  ignorePatterns: [
    'node_modules/',
    '.svelte-kit/',
    'build/',
    'dist/'
  ]
}