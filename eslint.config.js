import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      globals: {
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        location: 'readonly',
        MutationObserver: 'readonly',
        chrome: 'readonly',
        HTMLElement: 'readonly',
        Element: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    ignores: ['site/', 'node_modules/'],
  },
];
