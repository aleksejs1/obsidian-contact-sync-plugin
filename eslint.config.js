import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'coverage/', 'main.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettier,
  {
    plugins: {
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        {
          type: 'entry',
          pattern: 'src/main.ts',
        },
        {
          type: 'core',
          pattern: 'src/core/**/*',
        },
        {
          type: 'plugin',
          pattern: 'src/plugin/**/*',
        },
        {
          type: 'services',
          pattern: 'src/services/**/*',
        },
        {
          type: 'auth',
          pattern: 'src/auth/**/*',
        },
        {
          type: 'types',
          pattern: 'src/types/**/*',
        },
        {
          type: 'utils',
          pattern: 'src/utils/**/*',
        },
        {
          type: 'i18n',
          pattern: 'src/i18n/**/*',
        },
        {
          type: 'config',
          pattern: 'src/config/**/*',
        },
        {
          type: 'tests',
          pattern: 'src/__tests__/**/*',
        },
        {
          type: 'mocks',
          pattern: 'src/__mocks__/**/*',
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'boundaries/entry-point': [
        'error',
        {
          default: 'allow',
        },
      ],
      'boundaries/no-private': 'error',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              from: 'entry',
              allow: [
                'core',
                'plugin',
                'services',
                'auth',
                'types',
                'utils',
                'i18n',
                'config',
              ],
            },
            {
              from: 'core',
              allow: [
                'types',
                'utils',
                'config',
                'i18n',
                'core',
              ],
            },
            {
              from: 'plugin',
              allow: [
                'core',
                'services',
                'auth',
                'types',
                'utils',
                'i18n',
                'config',
                'plugin',
              ],
            },
            {
              from: 'services',
              allow: ['types', 'utils', 'config', 'services'],
            },
            {
              from: 'auth',
              allow: ['types', 'utils', 'config', 'auth'],
            },
            {
              from: 'types',
              allow: ['types'],
            },
            {
              from: 'utils',
              allow: ['utils'],
            },
            {
              from: 'i18n',
              allow: ['i18n', 'types'],
            },
            {
              from: 'config',
              allow: ['config'],
            },
            {
              from: 'tests',
              allow: [
                'core',
                'plugin',
                'services',
                'auth',
                'types',
                'utils',
                'i18n',
                'config',
                'mocks',
                'tests',
              ],
            },
          ],
        },
      ],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],
      complexity: ['error', 10],
    },
  },
  {
    files: ['src/__{tests,mocks}__/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
    },
  }
);
