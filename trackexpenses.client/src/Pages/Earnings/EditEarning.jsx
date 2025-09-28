import React, { useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import StatCard from "../../components/UI/StatCard";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

const EP_GET       = (id) => `Earnings/GetById/${id}`;
const EP_UPDATE    = (id) => `Earnings/UpdateEarningWithImage/${id}`;
const EP_UPD_INST  = `Earnings/UpdateEarningInstance`;
const EP_INST_IMG  = (instanceId) => `Earnings/Instance/UploadImage/${instanceId}`;
const CURRENCY = "EUR";

const unwrap = (v) => (Array.isArray(v) ? v : v?.$values ?? (v ?? []));
const N = (v) => (v ?? "").toString().trim();
const dateOnly = (s) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d)) return N(s).slice(0, 10);
  return d.toISOString().slice(0, 10);
};

// parse “1.234,56” / “1234.56”
const parseMoney = (val) => {
  if (val == null) return 0;
  let s = String(val).trim();
  if (!s) return 0;
  s = s.replace(/[^\d.,-]/g, "");
  const lastComma = s.lastIndexOf(","), lastDot = s.lastIndexOf(".");
  let dec = -1;
  if (lastComma >= 0 && lastDot >= 0) dec = Math.max(lastComma, lastDot);
  else if (lastComma >= 0) dec = lastComma;
  else if (lastDot >= 0) dec = lastDot;
  if (dec >= 0) {
    const intPart = s.slice(0, dec).replace(/[.,]/g, "");
    const frac = s.slice(dec + 1).replace(/[^\d]/g, "");
    s = `${intPart}.${frac}`;
  } else {
    s = s.replace(/[.,]/g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// Pills
const Pill = ({ tone = "neutral", children }) => {
  const styles = {
    neutral: "bg-slate-600/20 text-slate-300",
    success: "bg-emerald-600/15 text-emerald-300",
    danger:  "bg-rose-600/15 text-rose-400",
  }[tone];
  return <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${styles}`}>{children}</span>;
};

/* -------------------- Instance Modal -------------------- */
const InstanceModal = React.memo(function InstanceModal({ open, initial, onClose, onSave, t }) {
  const EMPTY = { Id: "", ExpectedDate: "", Amount: "", ReceivedAmount: "", IsReceived: false };
  const [form, setForm] = useState(initial || EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(initial || EMPTY); setFile(null); }, [initial, open]);
  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const doSave = async () => {
    if (!form?.Id || saving) return;
    setSaving(true);

    const expected = parseMoney(form.Amount);
    const receivedVal = parseMoney(form.ReceivedAmount);

    // “Received” é decidido apenas pelo checkbox; valor parcial não bloqueia.
    const markReceived = !!form.IsReceived;

    await onSave(
      {
        Id: form.Id,
        ExpectedDate: form.ExpectedDate,
        Amount: expected,
        IsReceived: markReceived,
        ReceivedAtUtc: markReceived ? new Date().toISOString() : null,
        __clientReceivedHint: receivedVal > 0 ? receivedVal : 0, // dica p/ UI (não persiste)
      },
      file
    );
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white/95 dark:bg-slate-800 rounded-xl p-5 w-[560px] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
        <div className="text-lg font-semibold mb-3">{t?.("earnings.instance.edit") || "Edit instance"}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input label={t?.("common.date") || "Date"} type="date" value={form.ExpectedDate || ""} onChange={(e) => set("ExpectedDate", e.target.value)} />
          <Input label={t?.("common.amount") || "Amount"} inputMode="decimal" value={form.Amount ?? ""} onChange={(e) => set("Amount", e.target.value)} />
          <Input label={t?.("earnings.instance.receivedAmount") || "Received amount"} inputMode="decimal" value={form.ReceivedAmount ?? ""} onChange={(e) => set("ReceivedAmount", e.target.value)} />
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={!!form.IsReceived} onChange={(e) => set("IsReceived", e.target.checked)} />
            <span>{t?.("earnings.status.received") || "Received"}</span>
          </label>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">{t?.("common.photo") || "Photo"}</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="text-xs opacity-70 mt-1">{t?.("earnings.instance.photoNote") || "Optional. Attaches to this instance."}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>{t?.("common.cancel") || "Cancel"}</Button>
          <Button onClick={doSave} disabled={saving}>{saving ? (t?.("common.saving") || "Saving…") : (t?.("common.save") || "Save")}</Button>
        </div>
      </div>
    </div>
  );
});
/* ------------------------------------------------------- */

export default function EditEarning() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage ? useLanguage() : { t: () => undefined };
  const { auth } = useContext(AuthContext) || {};

  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitial, setModalInitial] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null); setLoading(true);
      try {
        const res = await apiCall.get(EP_GET(id), { validateStatus: () => true });
        if (!alive) return;
        if (res?.status >= 200 && res?.status < 300) {
          const data = res.data || {};
          const instances = unwrap(data.Instances || data.instances).map((x) => ({
            ...x,
            ExpectedDate: x.ExpectedDate ?? x.expectedDate,
            Amount: Number(x.Amount ?? x.amount ?? 0),
            IsReceived: Boolean((x.IsReceived ?? x.isReceived) || (x.ReceivedAtUtc ?? x.receivedAtUtc)),
            ImagePath: x.ImageRelativePath ?? x.imageRelativePath ?? "",
            TempReceivedAmount: 0, // só UI
          }));
          setModel({
            Id: data.Id ?? data.id,
            Title: N(data.Title ?? data.title),
            Notes: N(data.Notes ?? data.notes),
            Amount: Number(data.Amount ?? data.amount ?? 0),
            Category: N(data.Category ?? data.category),
            WalletId: data.WalletId ?? data.walletId,
            FirstExpectedDate: dateOnly(data.FirstExpectedDate ?? data.firstExpectedDate ?? data.Date ?? data.date),
            ImagePath: data.ImageRelativePath ?? data.imageRelativePath ?? "",
            Instances: instances,
          });
        } else setErr(res?.data?.message || (t?.("errors.load") || "Failed to load earning."));
      } catch {
        setErr(t?.("errors.network") || "Network error while loading earning.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, t]);

  const receivedCount = useMemo(() => (model?.Instances || []).filter((i) => i.IsReceived || i.ReceivedAtUtc).length, [model]);
  const totalInstances = model?.Instances?.length || 0;
  const receivedAmount = useMemo(
    () => (model?.Instances || []).filter((i) => i.IsReceived || i.ReceivedAtUtc).reduce((s, i) => s + Number(i.Amount ?? 0), 0),
    [model]
  );
  const totalAmount = Number(model?.Amount || 0);
  const pendingAmount = Math.max(0, totalAmount - receivedAmount);

  const saveHeader = useCallback(async () => {
    if (!model) return;
    const fd = new FormData();
    fd.append("Title", model.Title || (t?.("earnings.form.title") || "Title"));
    fd.append("Notes", model.Notes || "");
    fd.append("Category", model.Category || "");
    fd.append("WalletId", String(model.WalletId || ""));
    fd.append("Amount", String(model.Amount || 0));
    fd.append("Date", model.FirstExpectedDate || dateOnly(new Date()));
    fd.append("Currency", CURRENCY);
    if (photoFile === null && model.ImagePath) fd.append("RemoveImage", "true");
    else if (photoFile) fd.append("ImageFile", photoFile);

    const res = await apiCall.put(EP_UPDATE(model.Id), fd, { headers: { "Content-Type": "multipart/form-data" }, validateStatus: () => true });
    if (!(res?.status >= 200 && res?.status < 300)) alert(res?.data?.message || (t?.("errors.save") || "Could not save."));
  }, [model, photoFile, t]);

  const openInstModal = useCallback((inst) => {
    setModalInitial({
      Id: inst.Id ?? inst.id,
      ExpectedDate: dateOnly(inst.ExpectedDate),
      Amount: String(inst.Amount ?? ""),
      ReceivedAmount: "",
      IsReceived: Boolean(inst.IsReceived),
    });
    setModalOpen(true);
  }, []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const uploadInstanceImage = useCallback(async (instanceId, file) => {
    if (!file) return null;
    const tryUpload = async (field) => {
      const fd = new FormData();
      fd.append(field, file);
      return apiCall.post(EP_INST_IMG(instanceId), fd, { headers: { "Content-Type": "multipart/form-data" }, validateStatus: () => true });
    };
    let up = await tryUpload("ImageFile");
    if (up?.status === 400) { up = await tryUpload("Image"); if (up?.status === 400) up = await tryUpload("File"); }
    return up;
  }, []);

  const saveInstance = useCallback(
    async (payload, file) => {
      const hint = Number(payload.__clientReceivedHint || 0);

      // optimistic UI
      setModel((m) => ({
        ...m,
        Instances: (m?.Instances || []).map((it) =>
          it.Id === payload.Id
            ? {
                ...it,
                ExpectedDate: payload.ExpectedDate,
                Amount: payload.Amount,
                IsReceived: payload.IsReceived,
                ReceivedAtUtc: payload.IsReceived ? (payload.ReceivedAtUtc || new Date().toISOString()) : null,
                TempReceivedAmount: (!payload.IsReceived && hint > 0) ? hint : 0,
              }
            : it
        ),
      }));

      const { __clientReceivedHint, ...serverPayload } = payload;
      const res = await apiCall.post(EP_UPD_INST, serverPayload, { validateStatus: () => true });
      if (!(res?.status >= 200 && res?.status < 300)) {
        alert(res?.data?.message || (t?.("errors.save") || "Could not save."));
        return;
      }

      if (file) {
        const up = await uploadInstanceImage(payload.Id, file);
        if (!(up?.status >= 200 && up?.status < 300)) {
          alert(up?.data?.message || (t?.("errors.upload") || "Could not upload image."));
        } else if (up?.data?.imageRelativePath) {
          setModel((m) => ({
            ...m,
            Instances: (m?.Instances || []).map((it) => (it.Id === payload.Id ? { ...it, ImagePath: up.data.imageRelativePath } : it)),
          }));
        }
      }
    },
    [uploadInstanceImage, t]
  );

  if (loading) return <div className="p-6 opacity-80">{t?.("common.loading") || "Loading…"}</div>;
  if (err) return <div className="p-6 text-red-500">{err}</div>;
  if (!model) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Title text={t?.("earnings.edit") || "Edit earning"} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate("/Earnings")}>{t?.("common.back") || "Back"}</Button>
          <Button onClick={saveHeader}>{t?.("common.save") || "Save"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("earnings.kpi.total") || t?.("earnings.table.total") || "Total"} value={totalAmount.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} accent="success" />
        <StatCard title={t?.("earnings.kpi.received") || `${t?.("earnings.status.received") || "Received"} (€)`} value={receivedAmount.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} accent="success" />
        <StatCard title={t?.("earnings.kpi.pending") || `${t?.("earnings.status.not_received") || "Not received"} (€)`} value={pendingAmount.toLocaleString(undefined, { style: "currency", currency: CURRENCY })} accent="success" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{t?.("earnings.instances._") || "Instances"}</div>

          <div className="text-sm opacity-80">
            {t?.("earnings.table.instances") || "Received/Pending"}: <span className="text-emerald-300">{receivedCount}</span> / {totalInstances}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[56rem] w-full text-sm">
            <thead className="text-left opacity-80">
              <tr className="[&>th]:px-3 [&>th]:py-2">
                <th>{t?.("common.date") || "Date"}</th>
                <th className="text-right">{t?.("common.amount") || "Amount"}</th>
                <th className="text-right">{t?.("earnings.instance.receivedAmount") || "Received amount"}</th>
                <th className="text-center">{t?.("earnings.status.title") || "Status"}</th>
                <th className="text-center">{t?.("common.photo") || "Photo"}</th>
                <th className="text-right">{t?.("common.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody className="[&>tr>td]:px-3 [&>tr>td]:py-2">
              {(model?.Instances || []).map((it) => {
                const isRec = Boolean(it.IsReceived || it.ReceivedAtUtc);
                const hasImg = Boolean(it.ImagePath);
                return (
                  <tr key={it.Id}>
                    <td>{dateOnly(it.ExpectedDate)}</td>
                    <td className="text-right">{Number(it.Amount || 0).toLocaleString(undefined, { style: "currency", currency: CURRENCY })}</td>
                    <td className="text-right">
                      {isRec
                        ? Number(it.Amount || 0).toLocaleString(undefined, { style: "currency", currency: CURRENCY })
                        : (it.TempReceivedAmount > 0
                            ? it.TempReceivedAmount.toLocaleString(undefined, { style: "currency", currency: CURRENCY })
                            : "—")}
                    </td>
                    <td className="text-center">
                      {isRec ? <Pill tone="success">{t?.("earnings.status.received") || "Received"}</Pill> : <Pill tone="danger">{t?.("earnings.status.not_received") || "Not received"}</Pill>}
                    </td>
                    <td className="text-center">
                      {hasImg
                        ? <Button size="sm" variant="secondary" onClick={() => setLightboxUrl(`/${it.ImagePath}`)}>{t?.("earnings.photo.view") || "View"}</Button>
                        : <Pill tone="danger">{t?.("earnings.photo.no_photo") || "No photo"}</Pill>}
                    </td>
                    <td className="text-right">
                      <Button size="sm" onClick={() => openInstModal(it)}>{t?.("common.edit") || "Edit"}</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {lightboxUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt={t?.("earnings.photo.view") || "View"} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <InstanceModal open={modalOpen && !!modalInitial} initial={modalInitial} onClose={closeModal} onSave={saveInstance} t={t} />
    </div>
  );
}
