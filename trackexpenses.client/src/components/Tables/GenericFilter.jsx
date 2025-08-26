// components/Tables/GenericFilter.jsx
import React from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";

/**
 * value: { q: string, [filterKey]: string | string[] }
 * filters: [{ key, label, type: 'select', options: [{value,label}], multiple }]
 */
export default function GenericFilter({
  value,
  onChange,
  filters = [],
  t,
  theme,
  searchPlaceholder = "Pesquisar...",
  className = "",
}) {
  const handleSearch = (e) => onChange({ ...value, q: e.target.value });
  const handleSelect = (key, nextVal) => onChange({ ...value, [key]: nextVal });

  const clearAll = () => {
    const cleared = { q: "" };
    filters.forEach((f) => (cleared[f.key] = f.multiple ? [] : (f.defaultValue ?? "all")));
    onChange(cleared);
  };

  return (
    <div className={`grid gap-3 grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] ${className}`}>
      {/* pesquisa */}
      <div className="relative min-w-0">
        <input
          type="text"
          value={value.q ?? ""}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 h-11"
          style={{ backgroundColor: theme?.colors?.background?.paper }}
        />
        <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* selects */}
      {filters.map((f) => (
        <div key={f.key} className="min-w-[180px]">
          {f.label && (
            <label className="block text-xs mb-1 text-gray-500 select-none">{f.label}</label>
          )}
          {f.type === "select" && (
            <select
              value={Array.isArray(value[f.key]) ? (value[f.key][0] ?? "") : (value[f.key] ?? "")}
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
      ))}

      <button
        type="button"
        onClick={clearAll}
        className="px-4 rounded-lg border border-gray-300 h-11 hover:bg-gray-50"
      >
        {t ? t("common.clear") : "Limpar"}
      </button>
    </div>
  );
}

GenericFilter.propTypes = {
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  filters: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.oneOf(["select"]).isRequired,
      options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
      multiple: PropTypes.bool,
      defaultValue: PropTypes.string,
    })
  ),
  t: PropTypes.func,
  theme: PropTypes.object,
  searchPlaceholder: PropTypes.string,
  className: PropTypes.string,
};
