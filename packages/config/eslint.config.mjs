/**
 * Base ESLint flat config for Waslah packages.
 *
 * Consumers extend it, e.g. in `apps/api/eslint.config.mjs`:
 *   import base from "@waslah/config/eslint.config.mjs";
 *   export default [...base, { /* package-specific rules *\/ }];
 *
 * Requires devDependencies (declared in this package): eslint ^9, typescript-eslint ^8.
 */
// @ts-check
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.next/**",
      "**/*.min.js",
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // Strictness aligned with tsconfig.base.json (Backend_SRS: TypeScript strict)
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "off",
    },
  }
);
