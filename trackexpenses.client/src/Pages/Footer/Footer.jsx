import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

export default function Footer() {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  // mesmas cores do TopBar
  const bg = c.background?.default || c.background?.paper || "#0B1020";
  const text = c.text?.secondary || c.text?.primary || "#E5E7EB";
  const topBorder =
    c.menu?.border || c.secondary?.light || "rgba(255,255,255,0.08)";

  // sombra “espelhada” (para cima): light→preta, dark→branca
  const footShadow =
    "0 -1px 0 rgba(255,255,255,0.08) inset, " +
    "0 -4px 12px rgba(0,0,0,0.18), " + // visível no light
    "0 -4px 16px rgba(255,255,255,0.25)"; // visível no dark

  return (
    <footer
      className="w-full text-center py-4 text-sm"
      style={{
        backgroundColor: bg,
        color: text,
        borderTop: `1px solid ${topBorder}`,
        boxShadow: footShadow,
      }}
    >
      © {new Date().getFullYear()} TrackExpenses. All rights reserved.
    </footer>
  );
}
