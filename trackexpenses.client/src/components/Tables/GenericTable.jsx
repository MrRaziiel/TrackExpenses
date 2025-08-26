// components/Tables/GenericTable.jsx
import React from "react";
import PropTypes from "prop-types";

function IconButton({ title, className, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-2 rounded hover:opacity-80 transition ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * Uso:
 * <GenericTable
 *   filteredData={rows}               // preferido (ou "data" como fallback)
 *   columns={[{ key, headerKey, headerLabel, accessor?, cell? }]}
 *   t={t} theme={theme}
 *   loading={false}
 *   rowKey={(row)=>row.id}
 *   stickyHeader
 *   truncateKeys={["fullName","email"]}
 *   minTableWidth="56rem"
 *   headClassName="bg-gray-50"                               // ⟵ NOVO
 *   headerCellClassName="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider" // ⟵ NOVO
 * />
 */
export default function GenericTable({
  // dados
  filteredData,
  data,
  columns = [],

  // i18n/tema
  t,
  theme,
  i18nPrefix = "common",

  // estados
  loading = false,
  emptyMessage = "Sem resultados",

  // ações
  edit,
  remove,
  rowKey,

  // UX extra
  stickyHeader = true,
  truncateKeys = [],
  minTableWidth = "56rem",
  truncateWidthClass = "max-w-[180px] sm:max-w-[260px]",

  // ⟵ NOVOS overrides de header
  headClassName,
  headerCellClassName,
}) {
  const rows = Array.isArray(filteredData)
    ? filteredData
    : Array.isArray(data)
    ? data
    : [];

  const hasActions = edit?.enabled || remove?.enabled;
  const shouldTruncate = (key) =>
    Array.isArray(truncateKeys) && truncateKeys.includes(key);

  const handleEditClick = (row) => {
    if (edit?.onEdit) return edit.onEdit(row);
    if (edit?.navigateTo && edit?.navigate) return edit.navigate(edit.navigateTo(row));
  };

  const handleDeleteClick = async (row) => {
    const ok = window.confirm(
      remove?.confirmMessage ||
        (t ? t("common.confirmDelete") : "Tens a certeza que queres apagar?")
    );
    if (!ok) return;
    try {
      const success = await remove.doDelete(row);
      if (success) remove?.onSuccess?.(row);
      else remove?.onError?.(new Error("delete failed"), row);
    } catch (err) {
      remove?.onError?.(err, row);
    }
  };

  // classes default do <th> (iguais às do teu ListExpenses)
  const thDefault =
    "px-6 py-3 text-xs font-medium text-left uppercase tracking-wider whitespace-nowrap";
  const thClass = headerCellClassName || thDefault;

  return (
    <table className="w-full table-auto border-collapse" style={{ minWidth: minTableWidth }}>
      <thead
        className={`${stickyHeader ? "sticky top-0 z-10" : ""} ${headClassName || ""}`}
        style={{
          // se passares headClassName, não forço a cor de fundo do tema
          backgroundColor: headClassName ? undefined : theme?.colors?.background?.paper,
          boxShadow: stickyHeader ? "0 1px 0 rgba(0,0,0,0.06)" : undefined,
        }}
      >
        <tr>
          {columns.map((col) => {
            const header =
              col.headerLabel ??
              (col.headerKey
                ? (t ? t(`${i18nPrefix}.${col.headerKey}`) : col.headerKey)
                : col.key);
            return (
              <th
                key={col.key}
                className={thClass}
                // mantemos a cor do texto do tema; se quiseres, podes também
                // remover este style e usar apenas a class
                style={{ color: theme?.colors?.text?.secondary }}
                title={typeof header === "string" ? header : undefined}
              >
                {header}
              </th>
            );
          })}

          {hasActions && (
            <th
              className={thClass}
              style={{ color: theme?.colors?.text?.secondary }}
            >
              {t ? t("common.actions") : "Ações"}
            </th>
          )}
        </tr>
      </thead>

      <tbody style={{ backgroundColor: theme?.colors?.background?.paper }}>
        {loading ? (
          <tr>
            <td className="px-6 py-6 text-center" colSpan={columns.length + (hasActions ? 1 : 0)}>
              {t ? t("common.loading") : "Carregando…"}
            </td>
          </tr>
        ) : rows.length === 0 ? (
          <tr>
            <td className="px-6 py-6 text-center" colSpan={columns.length + (hasActions ? 1 : 0)}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => {
            const k = rowKey ? rowKey(row, idx) : idx;
            return (
              <tr key={k} className="border-t">
                {columns.map((col) => {
                  const raw =
                    typeof col.accessor === "function" ? col.accessor(row) : row?.[col.key] ?? "-";
                  const value = typeof col.cell === "function" ? col.cell(raw, row) : raw;

                  const content = value ?? "-";
                  const isTrunc = shouldTruncate(col.key);

                  return (
                    <td key={col.key} className="px-6 py-4 text-sm align-middle">
                      {isTrunc ? (
                        <div className={`truncate ${truncateWidthClass}`} title={String(content)}>
                          {content}
                        </div>
                      ) : (
                        <div className="break-words">{content}</div>
                      )}
                    </td>
                  );
                })}

                {hasActions && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {edit?.enabled && (
                        <IconButton
                          title={t ? t("common.edit") : "Editar"}
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEditClick(row)}
                        >
                          ✏️
                        </IconButton>
                      )}
                      {remove?.enabled && (
                        <IconButton
                          title={t ? t("common.delete") : "Apagar"}
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDeleteClick(row)}
                        >
                          🗑️
                        </IconButton>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

GenericTable.propTypes = {
  filteredData: PropTypes.array,
  data: PropTypes.array,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      headerKey: PropTypes.string,
      headerLabel: PropTypes.string,
      accessor: PropTypes.func,
      cell: PropTypes.func,
    })
  ).isRequired,
  t: PropTypes.func,
  theme: PropTypes.object,
  i18nPrefix: PropTypes.string,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  edit: PropTypes.shape({
    enabled: PropTypes.bool,
    onEdit: PropTypes.func,
    navigateTo: PropTypes.func,
    navigate: PropTypes.func,
  }),
  remove: PropTypes.shape({
    enabled: PropTypes.bool,
    confirmMessage: PropTypes.string,
    doDelete: PropTypes.func,
    onSuccess: PropTypes.func,
    onError: PropTypes.func,
  }),
  rowKey: PropTypes.func,
  stickyHeader: PropTypes.bool,
  truncateKeys: PropTypes.arrayOf(PropTypes.string),
  minTableWidth: PropTypes.string,
  truncateWidthClass: PropTypes.string,

  // NOVOS
  headClassName: PropTypes.string,
  headerCellClassName: PropTypes.string,
};
