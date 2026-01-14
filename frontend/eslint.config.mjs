import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  // Backend uses CommonJS; allow require() there
  {
    files: ['backend/**', 'scripts/**'],
    rules: {
      'import/no-commonjs': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      // Allow unused vars in backend scripts to reduce noise during migration
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Relax some strict rules for the frontend to reduce widespread red errors
  {
    files: ['app/**', 'components/**', 'utils/**', 'pages/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react/no-unescaped-entities': 'off',
      // Project-wide: ignore unused variable warnings to reduce editor noise
      '@typescript-eslint/no-unused-vars': 'off',
      // Project uses many <img> for external images; relax this rule to reduce noise
      '@next/next/no-img-element': 'off',
      // Many existing effects reference local functions; disable exhaustive-deps warnings
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
]);

export default eslintConfig;
