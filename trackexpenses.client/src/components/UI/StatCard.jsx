import React from "react";
import PropTypes from "prop-types";
import { useTheme } from "../../styles/Theme/Theme";

export default function StatCard({
  icon,          // pode ser componente (Icon) OU elemento (<Icon />)
  title,
  value,
  trend,         // ex: "+12%" ou -3
  trendColor,
  className = "",
  onClick,
}) {
  const { theme } = useTheme();
  const c = theme?.colors || {};

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return React.cloneElement(icon, {
        className: ["h-6 w-6", icon.props?.className].filter(Boolean).join(" "),
        style: { color: c.primary?.main, ...(icon.props?.style || {}) },
      });
    }
    if (typeof icon === "function") {
      const IconComp = icon;
      return <IconComp className="h-6 w-6" style={{ color: c.primary?.main }} />;
    }
    return null;
  };

  const trendText =
    trend === 0 || trend
      ? typeof trend === "number"
        ? `${trend > 0 ? "+" : trend < 0 ? "−" : ""}${Math.abs(trend)}%`
        : String(trend)
      : "";

  return (
    <div
      onClick={onClick}
      className={[
        "rounded-2xl border p-5 flex items-start gap-4",
        onClick ? "cursor-pointer transition-shadow hover:shadow-lg" : "",
        className,
      ].join(" ")}
      style={{
        backgroundColor: c.background?.paper,
        borderColor: c.secondary?.light,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {icon ? (
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: theme?.colors?.menu?.hoverBg || c.secondary?.light }}
        >
          {renderIcon()}
        </div>
      ) : null}

      <div className="min-w-0">
        <div className="text-sm" style={{ color: c.text?.secondary }}>
          {title}
        </div>
        <div
          className="mt-1 text-2xl font-semibold truncate"
          style={{ color: c.text?.primary }}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
        {trendText ? (
          <div
            className="mt-1 text-xs font-medium"
            style={{ color: trendColor || c.text?.secondary }}
          >
            {trendText}
          </div>
        ) : null}
      </div>
    </div>
  );
}

StatCard.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  trendColor: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};
