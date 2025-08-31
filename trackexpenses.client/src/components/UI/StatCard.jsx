import React from "react";
import { useTheme } from "../../styles/Theme/Theme";

export default function StatCard({
  icon: Icon,
  title,
  value,
  trend,          // ex: "+12%" ou "-3%"
  trendColor,     // ex: theme.colors.success.main
  className = "",
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-5 flex items-start gap-4 ${onClick ? "cursor-pointer transition-shadow hover:shadow-lg" : ""} ${className}`}
      style={{
        backgroundColor: c.background?.paper,
        borderColor: c.secondary?.light,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
      }}
    >
      {Icon ? (
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: c.menu?.hoverBg || c.secondary?.light }}
        >
          <Icon className="h-6 w-6" style={{ color: c.primary?.main }} />
        </div>
      ) : null}

      <div className="min-w-0">
        <div className="text-sm" style={{ color: c.text?.secondary }}>{title}</div>
        <div className="mt-1 text-2xl font-semibold" style={{ color: c.text?.primary }}>{value}</div>
        {trend && (
          <div className="mt-1 text-xs font-medium" style={{ color: trendColor || c.text?.secondary }}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
