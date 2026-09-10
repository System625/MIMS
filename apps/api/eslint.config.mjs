import root from '../../eslint.config.mjs';

export default [
  ...root,
  {
    files: ['src/**/*.ts'],
    rules: {
      /**
       * Off for the API only.
       *
       * Nest resolves dependencies from the constructor parameter types that
       * `emitDecoratorMetadata` writes into the compiled output. Rewriting an
       * injectable's import to `import type` erases it at compile time, and the
       * provider then fails to resolve at runtime — a silent DI break that
       * typechecks cleanly. The rule stays on everywhere else.
       */
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },
];
