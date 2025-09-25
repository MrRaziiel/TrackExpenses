import React, { useEffect, useMemo, useState, useRef } from "react";
import Button from "../Buttons/Button";
import Card from "../../components/UI/Card";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const EP_LIST = (expenseId) => `Expenses/InstancesByExpense/${expenseId}`;
const EP_UPDATE = "Expenses/UpdateExpenseInstance";
const EP_UPLOAD = (instanceId) => `Expenses/Instance/UploadImage/${instanceId}`;

export default function InstancesEditor({ expenseId, t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [preview, setPreview] = useState(null); // {src, alt}

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      const r = await apiCall.get(EP_LIST(expenseId), { validateStatus: () => true });
      if (!alive) return;
      if (r?.status >= 200 && r?.status < 300) setRows(r.data || []);
      else setErr(r?.data?.message || "Could not load instances.");
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [expenseId]);

  const updateField = (id, field, value) => {
    setRows(prev => prev.map(r => r.Id === id ? { ...r, [field]: value } : r));
  };

  const saveRow = async (row) => {
    const payload = {
      Id: row.Id,
      DueDate: row.DueDate,
      IsPaid: row.IsPaid,
      Value: row.Value,
      PaidAmount: row.PaidAmount,
      PaidDate: row.PaidDate
    };
    const res = await apiCall.post(EP_UPDATE, payload, { validateStatus: () => true });
    if (res?.status >= 200 && res?.status < 300) {
      // replace with fresh server values
      setRows(prev => prev.map(r => r.Id === row.Id ? { ...r, ...res.data } : r));
    } else {
      alert(res?.data?.message || "Could not save instance.");
    }
  };

  const onPickImage = async (row, file) => {
    const form = new FormData();
    form.append("image", file);
    const res = await apiCall.post(EP_UPLOAD(row.Id), form, {
      headers: { "Content-Type": "multipart/form-data" },
      validateStatus: () => true
    });
    if (res?.status >= 200 && res?.status < 300) {
      setRows(prev => prev.map(r => r.Id === row.Id ? { ...r, imagePath: res.data?.imagePath } : r));
    } else {
      alert(res?.data?.message || "Could not upload image.");
    }
  };

  if (loading) return <Card>{t?.("common.loading") || "Loading..."}</Card>;
  if (err) return <Card><div className="text-red-600">{err}</div></Card>;

  return (
    <>
      <Card>
        <div className="text-sm font-medium mb-3">
          {t?.("instances.title") || "Expense instances"}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left opacity-70">
                <th className="py-2 pr-4">{t?.("instances.dueDate") || "Due date"}</th>
                <th className="py-2 pr-4">{t?.("instances.value") || "Value"}</th>
                <th className="py-2 pr-4">{t?.("instances.paidAmount") || "Paid amount"}</th>
                <th className="py-2 pr-4">{t?.("instances.paidDate") || "Paid date"}</th>
                <th className="py-2 pr-4">{t?.("instances.isPaid") || "Paid"}</th>
                <th className="py-2 pr-4">{t?.("instances.receipt") || "Receipt"}</th>
                <th className="py-2">{t?.("common.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
            {rows.map(r => (
              <tr key={r.Id} className="border-t border-white/10">
                <td className="py-2 pr-4">
                  <input type="date" value={String(r.DueDate).slice(0,10)}
                         onChange={e => updateField(r.Id, "DueDate", e.target.value)}
                         className="h-9 px-2 rounded border border-white/10 bg-transparent"/>
                </td>
                <td className="py-2 pr-4">
                  <input type="number" step="0.01" value={r.Value ?? 0}
                         onChange={e => updateField(r.Id, "Value", Number(e.target.value || 0))}
                         className="h-9 w-28 px-2 rounded border border-white/10 bg-transparent"/>
                </td>
                <td className="py-2 pr-4">
                  <input type="number" step="0.01" value={r.PaidAmount ?? 0}
                         onChange={e => updateField(r.Id, "PaidAmount", Number(e.target.value || 0))}
                         className="h-9 w-28 px-2 rounded border border-white/10 bg-transparent"/>
                </td>
                <td className="py-2 pr-4">
                  <input type="date" value={r.PaidDate ? String(r.PaidDate).slice(0,10) : ""}
                         onChange={e => updateField(r.Id, "PaidDate", e.target.value || null)}
                         className="h-9 px-2 rounded border border-white/10 bg-transparent"/>
                </td>
                <td className="py-2 pr-4">
                  <input type="checkbox" checked={!!r.IsPaid}
                         onChange={e => updateField(r.Id, "IsPaid", e.target.checked)} />
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    {r.imagePath ? (
                      <button type="button" className="h-9 w-9 rounded overflow-hidden ring-1 ring-white/10"
                              onClick={() => setPreview({ src: `/${r.imagePath}`, alt: "Receipt" })}>
                        <img src={`/${r.imagePath}`} alt="" className="w-full h-full object-cover"/>
                      </button>
                    ) : <span className="opacity-60 text-xs">{t?.("instances.noPhoto") || "No photo"}</span>}
                    <label className="text-xs underline cursor-pointer">
                      {t?.("instances.changePhoto") || "Change / add"}
                      <input type="file" accept="image/*" className="hidden"
                             onChange={e => e.target.files?.[0] && onPickImage(r, e.target.files[0])}/>
                    </label>
                  </div>
                </td>
                <td className="py-2">
                  <Button size="sm" onClick={() => saveRow(r)}>
                    {t?.("common.save") || "Save"}
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      </Card>

      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"
             onClick={() => setPreview(null)}>
          <img src={preview.src} alt={preview.alt} className="max-w-[90vw] max-h-[90vh] rounded shadow-xl"
               onClick={(e) => e.stopPropagation()}/>
        </div>
      )}
    </>
  );
}
