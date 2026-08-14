import iobrokerConfig, { reactConfig } from "@iobroker/eslint-config";

export default [
  ...iobrokerConfig,
  // React/JSX rules only make sense for the admin UI source, not the backend or test files
  ...reactConfig.map((config) => ({ ...config, files: ["admin/src/**/*.{ts,tsx}"] })),
  {
    // Mirrors .gitignore: dot-directories are local tooling/generated output (e.g. admin/.watch, .dev-server)
    ignores: ["build/**", "admin/build/**", "admin/words.js", "**/.*/**"],
  },
  {
    rules: {
      // Keep return types optional like before, the codebase does not annotate them everywhere
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "jsdoc/require-jsdoc": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    // Ambient .d.ts files rely on inline `import()` types to avoid becoming modules
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
