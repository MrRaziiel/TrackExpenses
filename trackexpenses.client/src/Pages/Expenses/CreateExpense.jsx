import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Title from "../../components/Titles/TitlePage";
import StatCard from "../../components/UI/StatCard";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea";
import Select from "../../components/Form/Select";
import Button from "../../components/Buttons/Button";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { useTheme } from "../../styles/Theme/Theme";
import QRCodeFromPhoto from "../../components/QR/QRCodeFromPhoto";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

const EP_CREATE  = "Expenses/CreateExpensesWithImage";
const EP_WALLETS = "/wallets?includeArchived=true";

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();
const LAST_WALLET_KEY = "te:lastWalletId";

/** Parser QR PT (Portaria 195/2020) */
function parsePortugueseInvoiceQR(qrText) {
  if (!qrText) return {};
  const parts = String(qrText).split("*").map(s => s.trim()).filter(Boolean);
  const map = {};
  for (const p of parts) {
    const i = p.indexOf(":");
    if (i <= 0) continue;
    map[p.slice(0, i).trim()] = p.slice(i + 1).trim();
  }
  const dateRaw = map.F;
  const date = /^\d{8}$/.test(dateRaw)
    ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
    : undefined;

  const total = map.O ? Number(String(map.O).replace(",", ".")) : undefined;
  const atcud = map.H;
  const docNo = map.G;
  const sellerNIF = map.A;

  const desc = [docNo ? `#${docNo}` : null, atcud ? `ATCUD:${atcud}` : null, sellerNIF ? `NIF:${sellerNIF}` : null]
    .filter(Boolean).join(" • ");

  return {
    StartDate: date,
    Value: total,
    Description: desc ? `Fatura ${desc}` : "",
  };
}

export default function CreateExpense() {
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext) || {};
  const { t } = useLanguage ? useLanguage() : { t: (k) => undefined };

  // método: one | installments | recurring
  const [kind, setKind] = useState("one");

  const [form, setForm] = useState({
    Name: t?.("expenses.form.defaultName") || "Expense",
    Description: "",
    Value: "",
    PayAmount: "",
    StartDate: new Date().toISOString().slice(0, 10),
    EndDate: "",
    RepeatCount: "",
    ShouldNotify: false,
    Periodicity: "Monthly",
    Category: "",
    WalletId: "",
    Image: null,
    UploadType: "ExpenseImage",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Preview + lightbox
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Input de ficheiro escondido + handlers
  const receiptInputRef = useRef(null);
  const openReceiptPicker = () => receiptInputRef.current?.click();

  const handleReceiptPick = (file) => {
    set("Image", file || null);
    setReceiptPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) URL.revokeObjectURL(receiptPreviewUrl);
    };
  }, [receiptPreviewUrl]);

  // Wallets
  const [wallets, setWallets] = useState([]);
  const walletOptions = useMemo(
    () => [{ id: "", name: t?.("wallets.select") || "Select wallet" },
      ...wallets.map(w => ({ id: w.Id ?? w.id, name: N(w.Name ?? w.name) }))],
    [wallets, t]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list = (r?.status >= 200 && r?.status < 300) ? (Array.isArray(r.data) ? r.data : unwrap(r.data)) : [];
        setWallets(list || []);
        const last = localStorage.getItem(LAST_WALLET_KEY);
        const firstId = (list?.[0]?.Id ?? list?.[0]?.id) || "";
        setForm((f) => ({ ...f, WalletId: f.WalletId || last || firstId }));
      } catch {/* ignore */}
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (form.WalletId) localStorage.setItem(LAST_WALLET_KEY, form.WalletId);
  }, [form.WalletId]);

  // QR (foto)
  const onQRDecoded = (text) => {
    const p = parsePortugueseInvoiceQR(text);
    setForm((f) => ({
      ...f,
      Description: p.Description || f.Description,
      StartDate: p.StartDate || f.StartDate,
      Value: p.Value != null ? String(p.Value) : f.Value,
    }));
  };

  // KPIs
  const total = Number(form.Value || 0);
  const upfront = Number(form.PayAmount || 0);
  const remaining = Math.max(0, total - upfront);

  // Parcelada
  const installmentsCount = Math.max(1, Number(form.RepeatCount || 0) || 1);
  const perInstallment = kind === "installments" ? (installmentsCount > 0 ? remaining / installmentsCount : 0) : 0;

  // submit
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);

  const buildFormData = () => {
    let Periodicity = "OneTime";
    let StartDate = form.StartDate;
    let EndDate = form.EndDate || "";
    let RepeatCount = 1;
    let PayAmount = Number(form.PayAmount || 0);

    if (kind === "installments") {
      Periodicity = "Monthly";
      RepeatCount = installmentsCount;
      if (StartDate && RepeatCount) {
        const d = new Date(StartDate);
        d.setMonth(d.getMonth() + RepeatCount - 1);
        EndDate = d.toISOString().slice(0, 10);
      }
    } else if (kind === "recurring") {
      Periodicity = form.Periodicity || "Monthly";
      RepeatCount = form.RepeatCount ? Number(form.RepeatCount) : 12;
    } else {
      Periodicity = "OneTime";
      RepeatCount = 1;
    }

    const fd = new FormData();
    fd.append("UserEmail", auth?.Email || "");
    fd.append("Name", form.Name || (t?.("expenses.form.defaultName") || "Expense"));
    fd.append("Description", form.Description || "");
    fd.append("Value", String(total || 0));
    fd.append("PayAmount", String(PayAmount || 0));
    fd.append("StartDate", StartDate);
    fd.append("EndDate", EndDate);
    fd.append("RepeatCount", String(RepeatCount || 1));
    fd.append("ShouldNotify", String(!!form.ShouldNotify));
    fd.append("Periodicity", Periodicity);
    fd.append("Category", form.Category || "");
    fd.append("WalletId", form.WalletId || "");
    if (form.Image) {
      fd.append("UploadType", form.UploadType || "ExpenseImage");
      fd.append("Image", form.Image);
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setSubmitting(true); setErr(null);
    try {
      const res = await apiCall.post(EP_CREATE, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
        validateStatus: () => true,
      });
      if (res?.status >= 200 && res?.status < 300) {
        window.location.assign("/Expenses");
        return;
      }
      setErr(res?.data?.message || res?.error?.message || (t?.("errors.createExpense") || "Could not create expense."));
    } catch {
      setErr(t?.("errors.network") || "Network error while creating expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Title text={t?.("expenses.new") || "New expense"} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title={t?.("expenses.total") || "Total"} value={total.toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
        <StatCard title={t?.("expenses.paid") || "Already paid"} value={upfront.toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
        <StatCard title={t?.("expenses.remaining") || "Remaining"} value={remaining.toLocaleString(undefined, { style: "currency", currency: "EUR" })} />
      </div>

      {/* QR + Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{t?.("qr.title") || "Read invoice QR (Portugal)"}</div>
              <p className="text-xs opacity-70">
                {t?.("qr.subtitle") || "Upload a clear photo of the QR. I'll auto-fill date, value and description."}
              </p>
            </div>
            <QRCodeFromPhoto
              buttonLabel={t?.("qr.readFromPhoto") || "Read QR from photo"}
              onDecoded={onQRDecoded}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-4">
            {/* Preview (click to enlarge) */}
            <button
              type="button"
              className="w-28 h-28 rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5 flex items-center justify-center shrink-0"
              onClick={() => receiptPreviewUrl && setLightboxOpen(true)}
              title={receiptPreviewUrl ? (t?.("receipt.clickToEnlarge") || "Click to enlarge") : ""}
            >
              {receiptPreviewUrl ? (
                <img src={receiptPreviewUrl} alt={t?.("receipt.previewAlt") || "Receipt preview"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs opacity-60 px-2 text-center">{t?.("receipt.noPreview") || "No preview"}</span>
              )}
            </button>

            {/* Uploader via button */}
            <div className="flex-1">
              <label className="block mb-1 text-sm font-medium">{t?.("receipt.label") || "Receipt / expense photo"}</label>

              <input
                ref={receiptInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleReceiptPick(e.target.files?.[0] || null)}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <Button type="button" onClick={openReceiptPicker}>
                  {receiptPreviewUrl ? (t?.("receipt.change") || "Change photo") : (t?.("receipt.add") || "Add photo")}
                </Button>

                {receiptPreviewUrl && (
                  <Button type="button" variant="secondary" onClick={() => handleReceiptPick(null)}>
                    {t?.("receipt.remove") || "Remove"}
                  </Button>
                )}
              </div>

              <p className="text-xs opacity-70 mt-2">
                {t?.("receipt.note") || "This is stored on the expense (not the QR reading)."}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Method */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center">
          <Button
            type="button"
            variant={kind === "one" ? "primary" : "secondary"}
            onClick={() => setKind("one")}
            className="w-56"
          >
            {t?.("expenses.method.one") || "One-off"}
          </Button>

          <Button
            type="button"
            variant={kind === "installments" ? "primary" : "secondary"}
            onClick={() => setKind("installments")}
            className="w-56"
          >
            {t?.("expenses.method.installments") || "Installments (credit)"}
          </Button>

          <Button
            type="button"
            variant={kind === "recurring" ? "primary" : "secondary"}
            onClick={() => setKind("recurring")}
            className="w-56"
          >
            {t?.("expenses.method.recurring") || "Recurring"}
          </Button>
        </div>

        {kind === "installments" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t?.("expenses.installments.count") || "Number of installments"}
              type="number"
              min="1"
              value={form.RepeatCount}
              onChange={(e) => set("RepeatCount", e.target.value)}
            />
            <div className="self-end text-sm opacity-75 md:col-span-2">
              {(t?.("expenses.installments.each") || "Each installment ≈")}{" "}
              {isFinite(perInstallment) ? perInstallment.toFixed(2) : "—"} €
              <span className="ml-2 opacity-60">
                {t?.("expenses.installments.note") || "(uses “Paid already” as the down payment)"}
              </span>
            </div>
          </div>
        )}

        {kind === "recurring" && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label={t?.("expenses.recurring.periodicity") || "Periodicity"}
              value={form.Periodicity}
              onChange={(e) => set("Periodicity", e.target.value)}
            >
              {["Daily","Weekly","Monthly","Yearly","Endless"].map((p, i) => (
                <option key={`p-${i}`} value={p}>
                  {t?.(`periodicity.${p.toLowerCase()}`) || p}
                </option>
              ))}
            </Select>
            <Input
              label={t?.("expenses.recurring.repeatCount") || "Repetitions (optional)"}
              type="number"
              min="1"
              value={form.RepeatCount}
              onChange={(e) => set("RepeatCount", e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Main form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t?.("expenses.form.name") || "Name"}
              value={form.Name}
              onChange={(e) => set("Name", e.target.value)}
              required
            />
            <Select
              label={t?.("expenses.form.wallet") || "Wallet"}
              value={form.WalletId}
              onChange={(e) => set("WalletId", e.target.value)}
              required
            >
              {walletOptions.map((w, i) => (
                <option key={w.id || `w-${i}`} value={w.id}>{w.name || "—"}</option>
              ))}
            </Select>

            <Input
              label={t?.("expenses.form.total") || "Total amount"}
              type="number"
              step="0.01"
              value={form.Value}
              onChange={(e) => set("Value", e.target.value)}
              required
            />
            <Input
              label={t?.("expenses.form.paidAlready") || "Paid already (optional)"}
              type="number"
              step="0.01"
              value={form.PayAmount}
              onChange={(e) => set("PayAmount", e.target.value)}
            />

            <Input
              label={t?.("expenses.form.startDate") || "Start date"}
              type="date"
              value={form.StartDate}
              onChange={(e) => set("StartDate", e.target.value)}
              required
            />
            <Input
              label={t?.("expenses.form.endDate") || "End date (optional)"}
              type="date"
              value={form.EndDate}
              onChange={(e) => set("EndDate", e.target.value)}
            />

            <Input
              label={t?.("expenses.form.category") || "Category"}
              value={form.Category}
              onChange={(e) => set("Category", e.target.value)}
            />
            <label className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={form.ShouldNotify}
                onChange={(e) => set("ShouldNotify", e.target.checked)}
              />
              <span>{t?.("expenses.form.notify") || "Notify"}</span>
            </label>
          </div>

          <TextArea
            label={t?.("expenses.form.description") || "Description"}
            rows={4}
            value={form.Description}
            onChange={(e) => set("Description", e.target.value)}
          />
        </Card>

        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>

      {/* Footer buttons */}
      <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
        <Button type="button" variant="secondary" onClick={() => window.history.back()} disabled={submitting}>
          {t?.("common.cancel") || "Cancel"}
        </Button>
        <Button type="submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (t?.("common.saving") || "Saving...") : (t?.("common.create") || "Create")}
        </Button>
      </div>

      {/* Lightbox */}
      {lightboxOpen && receiptPreviewUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={receiptPreviewUrl}
            alt={t?.("receipt.modalAlt") || "Receipt (enlarged)"}
            className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
