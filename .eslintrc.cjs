module.exports = {
	root: true,
	ignorePatterns: ['node_modules/', '.svelte-kit/', 'build/', 'dist/'],

	// Use the Svelte ESLint parser for everything
	parser: 'svelte-eslint-parser',
	parserOptions: {
		// This is the "inner" parser for <script lang="ts"> blocks
		parser: '@typescript-eslint/parser',
		ecmaVersion: 2020,
		sourceType: 'module',
		extraFileExtensions: ['.svelte']
	},

	plugins: ['svelte', '@typescript-eslint'],

	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended'
	],

	rules: {
		// globally turn off the no-at-html-tags rule
		'svelte/no-at-html-tags': 'off'
	}
}
