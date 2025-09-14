import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";
import Select from "../../components/Form/Select";
import Button from "../../components/Buttons/Button";
import GenericTable from "../../components/Tables/GenericTable";
import apiCall from "../../services/ApiCallGeneric/apiCall";

/** Endpoints (sem /api) */
const EP_GET     = (id) => `Expenses/GetExpenseById/${id}`;   // GET
const EP_UPDATE  = "Expenses/UpdateExpense";                   // PUT
const EP_MARK    = (iid) => `Expenses/MarkAsPaid/${iid}`;      // PATCH
const EP_UPD_INS = "Expenses/UpdateExpenseInstance";           // POST
const EP_IMG     = (id) => `Expenses/GetExpenseImage/${id}`;   // GET
const EP_UPL     = (id) => `Expenses/UploadImage/${id}`;       // POST

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));

export default function EditExpense() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [item, setItem] = useState(null);
  const [imgPath, setImgPath] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    Id: "", Name: "", Description: "",
    Value: "", PayAmount: "",
    StartDate: "", EndDate: "",
    RepeatCount: "", ShouldNotify: false,
    Periodicity: "OneTime", Category: "", GroupId: "",
  });
  const set = (k,v) => setForm((f)=>({ ...f, [k]: v }));

  /** Load expense + image */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr(null);

        const res = await apiCall.get(EP_GET(id));
        if (res?.ok) {
          const e = res.data;
          if (alive) {
            setItem(e);
            setForm({
              Id: e?.Id,
              Name: e?.Name || "",
              Description: e?.Description || "",
              Value: String(e?.Value ?? ""),
              PayAmount: String(e?.PayAmount ?? ""),
              StartDate: e?.StartDate ? new Date(e.StartDate).toISOString().slice(0,10) : "",
              EndDate: e?.EndDate ? new Date(e.EndDate).toISOString().slice(0,10) : "",
              RepeatCount: String(e?.RepeatCount ?? ""),
              ShouldNotify: !!e?.ShouldNotify,
              Periodicity: e?.Periodicity || "OneTime",
              Category: e?.Category || "",
              GroupId: e?.GroupId || "",
            });
          }
        } else if (alive) {
          setErr(res?.error?.message || "Não foi possível carregar a despesa.");
        }

        const img = await apiCall.get(EP_IMG(id));
        if (alive) {
          const rel = img?.data?.imagePath;
          setImgPath(rel && rel !== "NoPhoto" ? rel : null);
        }
      } catch {
        if (alive) setErr("Erro de rede.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const payload = {
        ...form,
        Value: Number(form.Value || 0),
        PayAmount: Number(form.PayAmount || 0),
      };
      const res = await apiCall.put(EP_UPDATE, payload);
      if (res?.ok) {
        window.location.assign("/Expenses");
        return;
      }
      setErr(res?.error?.message || "Não foi possível atualizar a despesa.");
    } catch {
      setErr("Erro de rede ao atualizar a despesa.");
    } finally {
      setSaving(false);
    }
  };

  // upload/substituir imagem
  const handleUpload = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("Image", file);
    const res = await apiCall.post(EP_UPL(id), fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res?.ok) {
      setImgPath(res?.data?.imagePath || null);
    } else {
      alert(res?.error?.message || "Não foi possível carregar a imagem.");
    }
  };

  // instâncias (ordenadas por data)
  const instances = unwrap(item?.Instances).sort((a,b)=> new Date(a.DueDate) - new Date(b.DueDate));

  const columns = [
    { key: "due", headerKey: "date", accessor: (i) => i?.DueDate ? new Date(i.DueDate).toLocaleDateString() : "-" },
    { key: "value", headerKey: "amount", accessor: (i) => Number(i?.Value || 0).toLocaleString(undefined,{style:"currency",currency:"EUR"}) },
    { key: "isPaid", headerKey: "paid", accessor: (i) => i?.IsPaid ? "Yes" : "No" },
  ];

  if (loading) return (
    <div className="space-y-6">
      <Title text="Edit Expense" />
      <div>Loading…</div>
    </div>
  );

  if (!item) return (
    <div className="space-y-6">
      <Title text="Edit Expense" />
      <div className="text-red-600">{err || "Expense not found."}</div>
    </div>
  );

  // URL absoluta para a imagem (se precisares do host do backend)
  const apiBase = import.meta.env.VITE_API_BASE_URL || "";
  const host = apiBase.replace(/\/+$/,''); // remove trailing slash
  const imgUrl = imgPath ? `${host}/${imgPath}` : null;

  return (
    <div className="space-y-6">
      <Title text="Edit Expense" />

      <form onSubmit={handleSave} className="space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Name" value={form.Name} onChange={(e)=>set("Name", e.target.value)} required />
            <Select label="Periodicity" value={form.Periodicity} onChange={(e)=>set("Periodicity", e.target.value)}>
              {["OneTime", "Daily", "Weekly", "Monthly", "Yearly", "Endless"].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </Select>

            <Input label="Value" type="number" step="0.01" value={form.Value} onChange={(e)=>set("Value", e.target.value)} required />
            <Input label="Already paid" type="number" step="0.01" value={form.PayAmount} onChange={(e)=>set("PayAmount", e.target.value)} />

            <Input label="Start date" type="date" value={form.StartDate} onChange={(e)=>set("StartDate", e.target.value)} required />
            <Input label="End date" type="date" value={form.EndDate} onChange={(e)=>set("EndDate", e.target.value)} />

            <Input label="Repeat count" type="number" min="1" value={form.RepeatCount} onChange={(e)=>set("RepeatCount", e.target.value)} />
            <Input label="Category" value={form.Category} onChange={(e)=>set("Category", e.target.value)} />

            <label className="flex items-center gap-2 mt-1">
              <input type="checkbox" checked={form.ShouldNotify} onChange={(e)=>set("ShouldNotify", e.target.checked)} />
              <span>Notify</span>
            </label>

            <div className="md:col-span-2">
              <TextArea label="Description" rows={4} value={form.Description} onChange={(e)=>set("Description", e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Imagem atual + upload */}
        <Card>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden ring-1 ring-gray-300 bg-gray-50 flex items-center justify-center">
              {imgUrl ? (
                <img src={imgUrl} alt="expense" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500">No image</span>
              )}
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Replace image</label>
              <input type="file" accept="image/*" onChange={(e)=>handleUpload(e.target.files?.[0])} />
            </div>
          </div>
        </Card>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>Save</Button>
          <Button type="button" variant="secondary" onClick={()=>window.history.back()} disabled={saving}>Cancel</Button>
        </div>
      </form>

      {/* Instâncias */}
      <Card title="Instances">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="relative overflow-x-auto">
            <GenericTable
              filteredData={instances}
              columns={columns}
              theme={{}}
              t={null}
              loading={false}
              rowKey={(i)=>i?.Id}
              stickyHeader
              minTableWidth="48rem"
              headClassName="bg-gray-50"
              headerCellClassName=""
              emptyMessage="Sem instâncias"
              edit={{
                enabled: true,
                onEdit: async (i) => {
                  const nextDate = prompt("Due date (YYYY-MM-DD):", i.DueDate?.slice(0,10) || "");
                  if (!nextDate) return;
                  const nextVal  = prompt("Value:", String(i.Value ?? ""));
                  const res = await apiCall.post(EP_UPD_INS, {
                    Id: i.Id,
                    DueDate: new Date(nextDate),
                    IsPaid: !!i.IsPaid,
                    Value: nextVal ? Number(nextVal) : undefined,
                  });
                  if (res?.ok) {
                    const r = await apiCall.get(EP_GET(id));
                    if (r?.ok) setItem(r.data);
                  } else {
                    alert(res?.error?.message || "Não foi possível atualizar a instância.");
                  }
                }
              }}
              remove={{
                enabled: true,
                confirmMessage: "Marcar esta instância como paga?",
                doDelete: async (i) => {
                  const res = await apiCall.patch(EP_MARK(i.Id), null);
                  if (res?.ok) {
                    const r = await apiCall.get(EP_GET(id));
                    if (r?.ok) setItem(r.data);
                    return true;
                  }
                  return false;
                }
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
