import React from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({
  html,               
  side = "right",     
  className = "",
}) {
  const sidePos = {
    right:  "left-[1.75rem] top-1/2 -translate-y-1/2",
    left:   "right-[1.75rem] top-1/2 -translate-y-1/2",
    top:    "left-1/2 -translate-x-1/2 bottom-[2.25rem]",
    bottom: "left-1/2 -translate-x-1/2 top-[2.25rem]",
  }[side];

  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      {/* ícone */}
      <span
        className="
          ml-1 inline-flex h-5 w-5 items-center justify-center
          rounded-full bg-blue-500/20 text-blue-400
          ring-1 ring-blue-500/30
          hover:bg-blue-500/30 hover:text-blue-300
          transition-colors cursor-default
          select-none
        "
        aria-hidden
      >
        <Info className="h-3.5 w-3.5" />
      </span>

      {/* tooltip */}
      <span
        className={`
          absolute z-50 ${sidePos}
          w-72 md:w-80
          opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
          pointer-events-none
          bg-gray-900/95 text-white text-[20px] leading-6
          px-4 py-3 rounded-xl shadow-xl ring-1 ring-black/20
          whitespace-normal break-words
          transition-opacity duration-150
        `}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </span>
  );
}
