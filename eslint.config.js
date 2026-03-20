import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.env*',
      '*.log',
      '.DS_Store',
      'docker-compose.yml',
      'Dockerfile',
      'deploy.sh',
      '.data/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        browser: true,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn about any, not error
      '@typescript-eslint/explicit-function-return-type': 'off', // Let TypeScript infer

      // General rules
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn/error
      'no-undef': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // React 19 doesn't need React in scope
      'prefer-const': 'error',
    },
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Node.js globals
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        // Built-in modules
        crypto: 'readonly',
        fs: 'readonly',
        path: 'readonly',
        url: 'readonly',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off', // Allow console in Node.js files
      'no-undef': 'off', // Disable for Node.js files
    },
  },
];
