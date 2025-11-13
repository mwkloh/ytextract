import tsparser from "@typescript-eslint/parser";
import obsidianmd from "eslint-plugin-obsidianmd";

export default [
  {
    files: ["**/*.ts"],
    plugins: {
      obsidianmd,
    },
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // Configure sentence case with common acronyms
      "obsidianmd/ui/sentence-case": ["warn", {
        acronyms: ["URL", "API", "LLM", "UI", "ID", "JSON", "HTML", "CSS", "JS", "TS"],
        allowAutoFix: true,
      }],
      // Turn off sample names check
      "obsidianmd/sample-names": "off",
      // Settings headings
      "obsidianmd/settings-tab/no-problematic-settings-headings": "warn",
    },
  },
];
