import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";

export default function SideBar({ items, collapsed, onToggle }) {
  const loc = useLocation();
  const theme = useTheme();
  return (
    <aside
      className={`
    hidden md:flex flex-col flex-shrink-0 transition-[width] duration-300 ease-in-out
    ${collapsed ? "w-16" : "w-60"} shadow-lg
  `}
      style={{
        backgroundColor: theme?.colors?.background?.default,
        borderTopRightRadius: "1.25rem", // arredondado canto superior direito
        borderBottomRightRadius: "1.25rem", // arredondado canto inferior direito
        boxShadow: "4px 0 12px rgba(0,0,0,0.1)", // para dar "ilusão" de flutuar
      }}
    >
      <div className="flex items-center justify-end h-12 px-2 border-b">
        <button
          onClick={onToggle}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          title={collapsed ? "Expandir" : "Colapsar"}
          aria-label="Alternar sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {items.map(({ to, icon: Icon, label, section, visible = true }, i) => {
          if (section) {
            return !collapsed && visible ? (
              <div
                key={`sec-${i}`}
                className="px-3 pb-2 pt-3 text-xs font-semibold text-gray-600"
              >
                {label}
              </div>
            ) : null;
          }
          if (!visible) return null;
          const active = loc.pathname
            .toLowerCase()
            .startsWith(to.toLowerCase());
          return (
            <Link
              key={to}
              to={to}
              className={`mx-2 mb-1 flex items-center gap-3 px-3 py-2 rounded-lg
                ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-blue-50"
                }`}
            >
              {Icon ? <Icon className="h-5 w-5 text-gray-600" /> : null}
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
