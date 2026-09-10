import root from '../../eslint.config.mjs';
import reactHooks from 'eslint-plugin-react-hooks';

// The plugin has moved its flat-config export between majors; take whichever is present.
const hooks =
  reactHooks.configs['recommended-latest'] ??
  reactHooks.configs.flat?.recommended ??
  reactHooks.configs.recommended;

export default [
  ...root,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: hooks.rules,
  },
];
