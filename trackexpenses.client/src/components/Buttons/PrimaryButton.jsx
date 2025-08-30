import React from "react";

export default function PrimaryButton({
 children,
  onClick,
  color = "#3B82F6",
  type = "button",
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium text-white whitespace-nowrap min-w-[9rem] h-11 ${className}`}
      style={{ backgroundColor: color }}
    >
      {children}
    </button>
  );
}
