import React from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";
import Button from "../Buttons/Button";

/**
 * value: { q: string, [filterKey]: string | string[] }
 * filters: [{ key, label, type: 'select', options: [{value,label}], multiple }]
 */
export default function GenericFilter({
  value = { q: "" },
  onChange = () => {},
  filters = [],
  t,
  theme,
  searchPlaceholder = "Pesquisar...",
  className = "",
  forceOneLine = false,
  rightActions = null, // opcional
}) {
  const safeValue = value ?? { q: "" };

  const handleSearch = (e) => onChange({ ...safeValue, q: e.target.value });
  const handleSelect = (key, nextVal) => onChange({ ...safeValue, [key]: nextVal });

  const clearAll = () => {
    const cleared = { q: "" };
    (filters || []).forEach(
      (f) => (cleared[f.key] = f.multiple ? [] : f.defaultValue ?? "all")
    );
    onChange(cleared);
  };

  const SearchBox = (
    <div className="relative min-w-[260px] flex-1">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search className="h-5 w-5 text-gray-400" />
      </span>
      <input
        type="text"
        value={safeValue.q ?? ""}
        onChange={handleSearch}
        placeholder={searchPlaceholder}
        className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-300"
        style={{ backgroundColor: theme?.colors?.background?.paper }}
      />
    </div>
  );

  const Selects = (filters || []).map((f) => (
    <div key={f.key} className="min-w-[180px] shrink-0">
      {f.label && (
        <label className="block text-xs mb-1 text-gray-500 select-none">
          {f.label}
        </label>
      )}
      {f.type === "select" && (
        <select
          value={
            Array.isArray(safeValue[f.key])
              ? safeValue[f.key][0] ?? ""
              : safeValue[f.key] ?? ""
          }
          onChange={(e) => handleSelect(f.key, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white h-11"
        >
          {(f.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  ));

  const ClearBtn = (
    <div className="shrink-0">
      <Button variant="secondary" onClick={clearAll} className="!px-4 h-11">
        {t ? t("common.clear") : "Limpar"}
      </Button>
    </div>
  );

  if (forceOneLine) {
    return (
      <div className={["flex items-center gap-3 overflow-x-auto no-scrollbar flex-nowrap", className].join(" ")}>
        {SearchBox}
        {Selects}
        {rightActions ?? ClearBtn}
      </div>
    );
  }

  return (
    <div className={`grid gap-3 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${className}`}>
      {SearchBox}
      {Selects}
      {rightActions ?? (
        <Button variant="secondary" onClick={clearAll} className="!px-4 h-11">
          {t ? t("common.clear") : "Limpar"}
        </Button>
      )}
    </div>
  );
}

GenericFilter.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.oneOf(["select"]).isRequired,
      options: PropTypes.arrayOf(
        PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })
      ),
      multiple: PropTypes.bool,
      defaultValue: PropTypes.string,
    })
  ),
  t: PropTypes.func,
  theme: PropTypes.object,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
  forceOneLine: PropTypes.bool,
  rightActions: PropTypes.node,
};
