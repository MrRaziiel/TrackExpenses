import React, { forwardRef } from "react";
import { useTheme } from "../../styles/Theme/Theme";

/**
 * Input
 * ------------------------------------------------------------------
 * Props:
 * - label, hint, error
 * - leftIcon, rightIcon (ReactNode)
 * - type, placeholder, ...rest
 */
const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    className = "",
    containerClassName = "",
    style,
    ...rest
  },
  ref
) {
  const { theme } = useTheme();
  const c = theme.colors;

  const borderColor = error
    ? (c.error?.main || "#EF4444")
    : (c.secondary?.light || "#CBD5E1");

  return (
    <div className={containerClassName}>
      {label && (
        <label className="block mb-1 text-sm font-medium"
          style={{ color: c.text?.secondary }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          className={`
            w-full h-11 rounded-xl border outline-none
            ${leftIcon ? "pl-10" : "pl-4"} ${rightIcon ? "pr-10" : "pr-4"}
            transition-shadow
            ${className}
          `}
          style={{
            backgroundColor: c.background?.paper || "#fff",
            color: c.text?.primary,
            borderColor,
            boxShadow: "0 0 0 0 rgba(0,0,0,0)",
            ...style
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 3px ${ (c.menu?.ring || "rgba(37,99,235,0.3)") }`;
            e.currentTarget.style.borderColor = c.primary?.main || "#2563EB";
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.borderColor = borderColor;
          }}
          {...rest}
        />

        {rightIcon && (
          <span className="absolute inset-y-0 right-3 flex items-center">
            {rightIcon}
          </span>
        )}
      </div>

      {(hint || error) && (
        <div className="mt-1 text-xs">
          {error ? (
            <span style={{ color: c.error?.main }}>{error}</span>
          ) : (
            <span style={{ color: c.text?.secondary }}>{hint}</span>
          )}
        </div>
      )}
    </div>
  );
});

export default Input;
