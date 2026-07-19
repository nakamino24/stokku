const baseConfig = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
    'plugin:@next/next/recommended',
    'plugin:@next/next/core-web-vitals',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'react', 'jsx-a11y', '@next/next'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        paths: ['src'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
      alias: {
        map: [
          ['@/', ['src']],
          ['@ui/*', ['../../packages/ui/src']],
          ['@shared/*', ['../../packages/shared/src']],
          ['@types/*', ['../../packages/types/src']],
          ['@validation/*', ['../../packages/validation/src']],
          ['@config/*', ['../../packages/config/src']],
          ['@database/*', ['../../packages/database/src']],
        ],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // Override or add rules here
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/anchor-is-valid': [
      'warn',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferHash'],
      },
    ],
  },
}

module.exports = baseConfig
