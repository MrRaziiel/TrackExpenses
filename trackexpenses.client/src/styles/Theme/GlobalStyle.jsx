// styles/Theme/GlobalStyles.jsx
import React from "react";
import { useTheme } from "../Theme/Theme";

function GlobalStyles() {
  const { theme } = useTheme();

  return (
    <style>{`
      :root {
        --color-primary: ${theme?.colors?.primary?.main};
        --color-primary-light: ${theme?.colors?.primary?.light};
        --color-primary-dark: ${theme?.colors?.primary?.dark};
        --color-secondary: ${theme?.colors?.secondary?.main};
        --color-secondary-light: ${theme?.colors?.secondary?.light};
        --color-secondary-dark: ${theme?.colors?.secondary?.dark};
        --color-background: ${theme?.colors?.background?.default};
        --color-paper: ${theme?.colors?.background?.paper};
        --color-text: ${theme?.colors?.text?.primary};
        --color-text-secondary: ${theme?.colors?.text?.secondary};
        --color-success: ${theme?.colors?.success?.main};
        --color-error: ${theme?.colors?.error?.main};
      }

      *, *::before, *::after { box-sizing: border-box; }
      html, body { height: 100%; }
      body {
        margin: 0;
        font-family: "Inter var", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background-color: var(--color-background);
        color: var(--color-text);
        line-height: 1.5;
      }

      img, svg, canvas, video { max-width: 100%; height: auto; }
      input, select, textarea, button { font: inherit; }
      input, select, textarea {
        background-color: var(--color-paper);
        color: var(--color-text);
        border-color: var(--color-secondary-light);
      }
/* globals.css */
select option {
  color: #0f172a;          /* texto escuro para o popup nativo */
  background: #ffffff;     /* fundo claro no dropdown */
}
@media (prefers-color-scheme: dark) {
  select option {
    color: #e5e7eb;
    background: #111827;
  }
}

      .bg-white { background-color: var(--color-paper) !important; }
      .text-gray-500 { color: var(--color-text-secondary) !important; }
      .text-gray-700, .text-gray-900 { color: var(--color-text) !important; }
      .border-gray-300 { border-color: var(--color-secondary-light) !important; }
      .bg-gray-50 { background-color: var(--color-secondary-light) !important; }
      .hover\\:bg-gray-50:hover { background-color: var(--color-secondary-light) !important; }
    `}</style>
  );
  
}


export default GlobalStyles;
