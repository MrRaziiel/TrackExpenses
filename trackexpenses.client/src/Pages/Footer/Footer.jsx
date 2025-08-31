// components/Layout/Footer.jsx
import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer
      className="w-full text-center py-4 text-sm text-white"
      style={{ backgroundColor: theme?.colors?.primary?.main }}
    >
      © {new Date().getFullYear()} TrackExpenses. All rights reserved.
    </footer>
  );
}
