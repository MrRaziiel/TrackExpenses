import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select"
import TextArea from "../../components/Form/TextArea";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const EP_WALLETS   = "/Wallet/List";
const EP_CATEGORIES = "/Category/List";

const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();

export default function ExpenseForm({
  mode = "create",                 // "create" | "edit"
  initialData = null,              // dados da despesa no modo edição
  onSubmit,                        // async (payload) => boolean
  submitting = false,
  serverError = null,
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState(() => ({
    date: "",
    description: "",
    amount: "",
    currency: "EUR",
    walletId: "",
    categoryId: "",
    notes: "",
  }));
  const [wallets, setWallets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  // Prefill (edit)
  useEffect(() => {
    if (!initialData) return;
    const d = initialData;
    setForm({
      date: (d.date ?? d.Date) ? new Date(d.date ?? d.Date).toISOString().slice(0,10) : "",
      description: N(d.description ?? d.Description),
      amount: String(d.amount ?? d.Amount ?? ""),
      currency: N(d.currency ?? d.Currency) || "EUR",
      walletId: d.walletId ?? d.WalletId ?? d.wallet?.id ?? d.Wallet?.Id ?? "",
      categoryId: d.categoryId ?? d.CategoryId ?? d.category?.id ?? d.Category?.Id ?? "",
      notes: N(d.notes ?? d.Notes),
    });
  }, [initialData]);

  // Fetch wallets/categories
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [w, c] = await Promise.all([
          apiCall.get(EP_WALLETS, { validateStatus: () => true }),
          apiCall.get(EP_CATEGORIES, { validateStatus: () => true }),
        ]);
        if (!alive) return;
        if (w?.status >= 200 && w?.status < 300) {
          const list = Array.isArray(w.data) ? w.data : unwrap(w.data);
          setWallets(list);
        } else setWallets([]);
        if (c?.status >= 200 && c?.status < 300) {
          const list = Array.isArray(c.data) ? c.data : unwrap(c.data);
          setCategories(list);
        } else setCategories([]);
      } catch {
        if (!alive) return;
        setWallets([]); setCategories([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Helpers
  const walletsOpts = useMemo(
    () => [{ id:"", name: t?.("common.selectWallet") || "Select wallet" },
      ...wallets.map(w => ({ id: w.id ?? w.Id, name: N(w.name ?? w.Name) }))],
    [wallets, t]
  );
  const categoriesOpts = useMemo(
    () => [{ id:"", name: t?.("common.selectCategory") || "Select category" },
      ...categories.map(c => ({ id: c.id ?? c.Id, name: N(c.name ?? c.Name) }))],
    [categories, t]
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.date) e.date = t?.("validation.required") || "Required";
    if (!form.description) e.description = t?.("validation.required") || "Required";
    const num = Number(form.amount);
    if (!form.amount && form.amount !== 0) e.amount = t?.("validation.required") || "Required";
    else if (Number.isNaN(num)) e.amount = t?.("validation.number") || "Invalid number";
    if (!form.walletId) e.walletId = t?.("validation.required") || "Required";
    if (!form.categoryId) e.categoryId = t?.("validation.required") || "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const payload = {
      Date: form.date,
      Description: form.description,
      Amount: Number(form.amount),
      Currency: form.currency || "EUR",
      WalletId: form.walletId,
      CategoryId: form.categoryId,
      Notes: form.notes || null,
    };
    const ok = await onSubmit?.(payload);
    if (ok) navigate("/Expenses"); // volta à lista
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t?.("common.date") || "Date"}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            error={errors.date}
          />
          <Input
            label={t?.("expenses.amount") || "Amount"}
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
            error={errors.amount}
          />
          <Select
            label={t?.("common.currency") || "Currency"}
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {["EUR","USD","GBP"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
          <Select
            label={t?.("common.wallet") || "Wallet"}
            value={form.walletId}
            onChange={(e) => set("walletId", e.target.value)}
            error={errors.walletId}
          >
            {walletsOpts.map((w) => (
              <option key={w.id} value={w.id}>{w.name || "—"}</option>
            ))}
          </Select>
          <Select
            label={t?.("common.category") || "Category"}
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            error={errors.categoryId}
          >
            {categoriesOpts.map((c) => (
              <option key={c.id} value={c.id}>{c.name || "—"}</option>
            ))}
          </Select>
          <Input
            label={t?.("common.description") || "Description"}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            error={errors.description}
          />
        </div>

        <TextArea
          label={t?.("common.notes") || "Notes"}
          rows={4}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </Card>

      {serverError && (
        <div className="text-sm text-red-600">{serverError}</div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {mode === "edit" ? (t?.("common.save") || "Save") : (t?.("common.create") || "Create")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(-1)}
          disabled={submitting}
        >
          {t?.("common.cancel") || "Cancel"}
        </Button>
      </div>
    </form>
  );
}
