import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  {
    rules: {
      // TypeScript zaten tip kontrolü yapıyor — no-undef TypeScript projesinde gereksiz
      "no-undef": "off",

      // 200+ any hatası mevcut teknik borç — uyarıya düşür, hata olarak engelleme
      "@typescript-eslint/no-explicit-any": "warn",

      // Kullanılmayan değişkenler — uyarı olarak bırak, build'i engelleme
      "@typescript-eslint/no-unused-vars": "warn",

      // JSX scope — Next.js / React 17+ gerekmiyor
      "react/react-in-jsx-scope": "off",

      // JSX içindeki Türkçe tırnak karakterleri (', ", vb.) — uyarı, runtime riski yok
      "react/no-unescaped-entities": "warn",

      // React hooks kuralları
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;
