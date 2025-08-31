import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

/**
 * Card
 * ------------------------------------------------------------------
 * Props:
 * - title: string | ReactNode
 * - actions: ReactNode (botões à direita do título)
 * - footer: ReactNode
 * - padding: 'none' | 'sm' | 'md' (default md)
 * - hover: boolean (elevação no hover)
 * - clickable: boolean (cursor + hover)
 * - onClick: () => void
 */
export default function Card({
  title,
  actions,
  footer,
  padding = "md",
  hover = false,
  clickable = false,
  onClick,
  className = "",
  style,
  children,
  ...rest
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const paddings = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
  };

  return (
    <section
      className={`
        rounded-2xl border ${paddings[padding]}
        ${hover || clickable ? "transition-shadow" : ""}
        ${clickable ? "cursor-pointer" : ""}
        ${className}
      `}
      style={{
        backgroundColor: c.background?.paper || "#fff",
        borderColor: c.secondary?.light || "#E5E7EB",
        boxShadow: hover || clickable ? "0 10px 30px rgba(0,0,0,0.06)" : "0 1px 2px rgba(0,0,0,0.03)",
        ...style
      }}
      onClick={onClick}
      {...rest}
    >
      {(title || actions) && (
        <header className="flex items-center justify-between pb-4 border-b"
          style={{ borderColor: c.secondary?.light || "#E5E7EB" }}
        >
          <div className="text-base font-semibold" style={{ color: c.text?.primary }}>
            {title}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}

      <div className={title || actions ? "pt-4" : ""}>
        {children}
      </div>

      {footer && (
        <footer className="mt-4 pt-4 border-t"
          style={{ borderColor: c.secondary?.light || "#E5E7EB" }}
        >
          {footer}
        </footer>
      )}
    </section>
  );
}
