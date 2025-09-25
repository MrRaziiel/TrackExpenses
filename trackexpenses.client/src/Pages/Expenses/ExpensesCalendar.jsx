import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Button from "../../components/Buttons/Button";
import Select from "../../components/Form/Select";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import {
  addDays, addMonths, subMonths,
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  isSameMonth, isSameDay, format, parseISO
} from "date-fns";

/* ---- endpoints ---- */
const EP_LIST_EXP   = "Expenses/ListExpenses";
const EP_WALLETS    = "/wallets?includeArchived=true";
const EP_GROUP_MEMBERS_A = "/Group/ListMembers";
const EP_GROUP_MEMBERS_B = "/Group/MyMembers";

/* ---- helpers ---- */
const unwrap = (v) => (Array.isArray(v) ? v : (v?.$values ?? []));
const N = (v) => (v ?? "").toString().trim();
const toDateSafe = (v) => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v);
  // aceita "2024-04-05" ou "2024-04-05T00:00:00Z"
  try { const d = s.length > 10 ? parseISO(s) : parseISO(`${s}T00:00:00`); return isNaN(d) ? null : d; }
  catch { return null; }
};

export default function ExpensesCalendar() {
  const { t } = useLanguage ? useLanguage() : { t: () => undefined };
  const { auth } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  const isGroupAdmin =
    Array.isArray(auth?.Roles) &&
    auth.Roles.some((r) => String(r).toLowerCase() === "groupadmin");

  /* ---- state ---- */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [wallets, setWallets] = useState([]);
  const [walletFilter, setWalletFilter] = useState("ALL");

  const [userOptions, setUserOptions] = useState([]); // [{email, name}]
  const [userFilter, setUserFilter] = useState(isGroupAdmin ? "SELF" : "SELF"); // SELF | email | ALL

  // grid
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [showInstances, setShowInstances] = useState(true);
  const [showEndDates, setShowEndDates] = useState(true);

  const [rows, setRows] = useState([]);

  /* ---- load wallets ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await apiCall.get(EP_WALLETS, { validateStatus: () => true });
        if (!alive) return;
        const list = (r?.status >= 200 && r?.status < 300)
          ? (Array.isArray(r.data) ? r.data : unwrap(r.data))
          : [];
        setWallets(list || []);
      } catch {/* ignore */ }
    })();
    return () => { alive = false; };
  }, []);

  /* ---- load group members if admin ---- */
  useEffect(() => {
    if (!isGroupAdmin) return;
    let alive = true;

    const normalizeUsers = (arr) =>
      (arr || [])
        .map((u) => ({
          email: (u.Email ?? u.email ?? u.UserEmail ?? u.userEmail ?? "").trim(),
          name: N(
            u.Name ?? u.name ?? u.DisplayName ?? u.displayName ?? u.FullName ?? u.fullName ?? u.email ?? ""
          ),
        }))
        .filter((u) => u.email);

    (async () => {
      try {
        let users = null;
        for (const url of [EP_GROUP_MEMBERS_A, EP_GROUP_MEMBERS_B]) {
          try {
            const res = await apiCall.get(url, { validateStatus: () => true });
            if (res?.status >= 200 && res?.status < 300) {
              users = normalizeUsers(Array.isArray(res.data) ? res.data : unwrap(res.data));
              if (users?.length) break;
            }
          } catch {}
        }
        if (alive && Array.isArray(users) && users.length) {
          setUserOptions(users);
        }
      } catch {/* ignore */ }
    })();

    return () => { alive = false; };
  }, [isGroupAdmin]);

  /* ---- load expenses on filter change ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");

      try {
        // choose user param
        let emailParam = auth?.Email || "";
        const params = {};

        if (isGroupAdmin) {
          if (userFilter === "SELF") emailParam = auth?.Email || "";
          else if (userFilter === "ALL") emailParam = ""; 
          else emailParam = userFilter || "";
        }

        if (emailParam) params.userEmail = emailParam;

        const res = await apiCall.get(EP_LIST_EXP, { params, validateStatus: () => true });
        if (!alive) return;

        if (res?.status >= 200 && res?.status < 300) {
          const list = Array.isArray(res.data) ? res.data : unwrap(res.data);

          const data = list.map((e) => {
            const instances = unwrap(e?.Instances ?? e?.instances);
            const walletId = e?.WalletId ?? e?.walletId ?? "";
            return {
              id: e?.Id ?? e?.id,
              userEmail: (e?.UserEmail ?? e?.userEmail ?? emailParam ?? "").trim(),
              name: N(e?.Name ?? e?.name),
              category: N(e?.Category ?? e?.category),
              startDate: toDateSafe(e?.StartDate ?? e?.startDate),
              endDate: toDateSafe(e?.EndDate ?? e?.endDate),
              walletId,
              instances: (instances || []).map((i) => ({
                id: i?.Id ?? i?.id,
                date: toDateSafe(i?.Date ?? i?.date),
                amount: i?.Amount ?? i?.amount,
              })),
            };
          });

          setRows(data);

          // admin fallback: derive users from data if options empty
          if (isGroupAdmin && userOptions.length === 0) {
            const derived = Array.from(
              new Map(
                data
                  .filter((r) => r.userEmail)
                  .map((r) => [r.userEmail, { email: r.userEmail, name: r.userEmail }])
              ).values()
            );
            setUserOptions(derived);
          }
        } else {
          setErr(res?.data?.message || "Failed to load expenses.");
        }
      } catch {
        setErr("Network error while loading expenses.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [auth?.Email, isGroupAdmin, userFilter]);

  /* ---- events for the month ---- */
  const events = useMemo(() => {
    const out = [];
    for (const e of rows) {
      if (walletFilter !== "ALL" && e.walletId !== walletFilter) continue;

      if (showInstances) {
        for (const ins of e.instances || []) {
          if (!ins.date) continue;
          out.push({
            id: `ins-${ins.id}`,
            date: ins.date,
            kind: "instance",
            title: e.name || t?.("calendar.instance") || "Instance",
            amount: ins.amount,
            color: "bg-blue-500",
            border: "ring-blue-400/40",
            expenseId: e.id,
          });
        }
      }

      if (showEndDates && e.endDate) {
        out.push({
          id: `end-${e.id}`,
          date: e.endDate,
          kind: "end",
          title: e.name || t?.("calendar.expense") || "Expense",
          color: "bg-rose-500",
          border: "ring-rose-400/40",
          expenseId: e.id,
        });
      }
    }
    return out;
  }, [rows, walletFilter, showInstances, showEndDates, t]);

  /* ---- calendar grid ---- */
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

  const weeks = [];
  let cursor = start;
  while (cursor <= end) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(days);
  }

  const eventsOn = (d) =>
    events
      .filter((ev) => isSameDay(ev.date, d))
      .sort((a, b) => (a.kind === "end" ? -1 : 1)); 

  const goPrev = () => setMonth((m) => subMonths(m, 1));
  const goNext = () => setMonth((m) => addMonths(m, 1));
  const goToday = () => setMonth(startOfMonth(new Date()));
  const openExpense = (id) => navigate(`/Expenses/Edit/${id}`);

  /* ---- select options ---- */
  const walletSelectOptions = useMemo(
    () => [
      { id: "ALL", name: t?.("calendar.allWallets") || "All wallets" },
      ...wallets.map((w) => ({ id: w.Id ?? w.id, name: N(w.Name ?? w.name) })),
    ],
    [wallets, t]
  );

  const userSelectOptions = useMemo(() => {
    if (!isGroupAdmin) return [];
    const base = [{ email: "SELF", name: t?.("calendar.me") || "Me" }];
    base.push({ email: "ALL", name: t?.("calendar.allUsers") || "All users" });
    const members = userOptions
      .filter((u) => u.email && u.email !== (auth?.Email || ""))
      .sort((a, b) => a.name.localeCompare(b.name));
    return [...base, ...members];
  }, [isGroupAdmin, userOptions, t, auth?.Email]);

  /* ---- UI ---- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Title text={t?.("calendar.title") || "Expenses calendar"} />

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" className="h-10 rounded-lg" onClick={goPrev}>
            ‹
          </Button>
          <Button variant="secondary" size="md" className="h-10 rounded-lg" onClick={goToday}>
            {t?.("calendar.today") || "Today"}
          </Button>
          <Button variant="secondary" size="md" className="h-10 rounded-lg" onClick={goNext}>
            ›
          </Button>
        </div>
      </div>

      <Card>
        {/* Toolbar / Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="text-lg font-semibold">{format(month, "MMMM yyyy")}</div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Wallet */}
            <div className="min-w-[220px]">
              <Select
                label={t?.("calendar.wallet") || "Wallet"}
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
              >
                {walletSelectOptions.map((w, i) => (
                  <option key={`w-${w.id}-${i}`} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* User (GroupAdmin only) */}
            {isGroupAdmin && (
              <div className="min-w-[220px]">
                <Select
                  label={t?.("calendar.user") || "User"}
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  {userSelectOptions.map((u, i) => (
                    <option key={`u-${u.email}-${i}`} value={u.email}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Toggles */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showInstances}
                onChange={(e) => setShowInstances(e.target.checked)}
              />
              <span>{t?.("calendar.showInstances") || "Show instances"}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showEndDates}
                onChange={(e) => setShowEndDates(e.target.checked)}
              />
              <span>{t?.("calendar.showEndDates") || "Show end dates"}</span>
            </label>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            {t?.("calendar.legend.instance") || "Instance"}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            {t?.("calendar.legend.end") || "End date"}
          </span>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 text-xs font-medium opacity-70 select-none mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <div key={i} className="px-2 py-1">
              {t?.(`calendar.dow.${i + 1}`) || d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden border border-white/10 bg-white/10">
          {weeks.map((week, wi) => (
            <React.Fragment key={`w-${wi}`}>
              {week.map((d, di) => {
                const inMonth = isSameMonth(d, month);
                const today = isSameDay(d, new Date());
                const evs = eventsOn(d);

                return (
                  <div
                    key={`d-${wi}-${di}`}
                    className={[
                      "min-h-[104px] bg-black/20 p-2",
                      inMonth ? "opacity-100" : "opacity-50",
                      "hover:bg-white/5 transition",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={[
                          "text-xs font-semibold",
                          today ? "text-emerald-400" : "opacity-80",
                        ].join(" ")}
                      >
                        {format(d, "d")}
                      </div>
                    </div>

                    {/* events */}
                    <div className="mt-1 space-y-1">
                      {evs.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => openExpense(ev.expenseId)}
                          title={
                            ev.kind === "instance"
                              ? `${t?.("calendar.instanceOf") || "Instance of"} ${ev.title}${
                                  ev.amount != null ? ` • ${ev.amount}` : ""
                                }`
                              : `${t?.("calendar.endOf") || "End of"} ${ev.title}`
                          }
                          className={[
                            "group w-full flex items-center gap-2 text-left text-[11px] rounded-md px-2 py-1",
                            "ring-1 ring-inset",
                            ev.color,
                            ev.border,
                            "bg-opacity-90 hover:bg-opacity-100",
                          ].join(" ")}
                        >
                          <span className="inline-block h-2 w-2 rounded-full bg-white/90" />
                          <span className="truncate">
                            {ev.kind === "instance"
                              ? t?.("calendar.instance") || "Instance"
                              : t?.("calendar.end") || "End"}
                            {" — "}
                            <span className="opacity-90">{ev.title}</span>
                          </span>
                        </button>
                      ))}

                      {!evs.length && (
                        <div className="text-[11px] opacity-40">
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* states */}
        {loading && (
          <div className="mt-4 text-sm opacity-70">
            {t?.("calendar.loading") || "Loading…"}
          </div>
        )}

        {!loading && events.length === 0 && !err && (
          <div className="mt-4 text-sm opacity-70">
            {t?.("empty.noEvents") || "No events for the current filters."}
          </div>
        )}

        {err && <div className="mt-4 text-sm text-red-500">{err}</div>}
      </Card>
    </div>
  );
}
