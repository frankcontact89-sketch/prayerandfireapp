import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      // Auto-generated artifacts; lint their source templates instead of generated output.
      "supabase/functions/mcp/index.ts",
      "src/integrations/supabase/previewAuthStorage.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      // Existing explicit-any sites are tracked as technical debt, but they are not
      // TypeScript compile failures. Keep them visible without blocking a release.
      "@typescript-eslint/no-explicit-any": "warn",
      // Empty catch blocks are intentional best-effort fallbacks in several UI paths.
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
);
