import React, { useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";


const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

export default function CreateGroup({
  createEndpoint = "/Group/Create",
  userLookupEndpoint = "/User/EmailCheckInDb",
  onSuccess,
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth} = useContext(AuthContext) || {};
 

  const c = theme?.colors || {};
  const paper = c.background?.paper || "#111827";
  const border = c.menu?.border || "rgba(255,255,255,0.12)";
  const text = c.text?.primary || "#E5E7EB";
  const muted = c.text?.secondary || "#94A3B8";
  const errorCol = c.error?.main || "#EF4444";
  const hover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";

  const tr = (k, fallback) => { try { return k?.includes(".") ? t(k) : (k ?? fallback); } catch { return fallback ?? k; } };

  // ---- state
  const [name, setName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]); // [{id, email, name}]
  const [busy, setBusy] = useState(false);
  const [memberBusy, setMemberBusy] = useState(false);
  const [err, setErr] = useState("");
  const [submitted, setSubmitted] = useState(false); // <- novo

  // ---- validações (name só mostra erro se submitted === true)
  const errors = useMemo(() => {
    const e = {};
    if (submitted && !name.trim()) e.name = tr("groups.errors_name_required", "Name is required");
    if (memberInput && !isEmail(memberInput)) e.memberInput = tr("groups.errors_invalid_email", "Invalid email");
    return e;
  }, [name, memberInput, submitted]);

  const lookupAndAddMember = async () => {
    setErr("");
    const email = memberInput.trim();
    if (!email || !isEmail(email)) return;
    if (members.some((m) => m.email.toLowerCase() === email.toLowerCase())) { setMemberInput(""); return; }

    setMemberBusy(true);
    try {
      if (auth.Email == email)
        {
          setErr(tr("groups.error_equal_email", "No need to add yourself."));
          return
        } 
      let res = await apiCall.get(userLookupEndpoint, { params: { email }, validateStatus: () => true });
      if (!res || (res.status >= 400 && res.status !== 404)) {
        res = await apiCall.post(userLookupEndpoint, { email }, { validateStatus: () => true });
      }
      if (res?.status >= 200 && res?.status < 300 && res?.data) {
        const user = res.data;
        const userId = user.id ?? user.userId ?? user.guid ?? user._id;
        const displayName = user.name ?? user.displayName ?? user.fullName ?? email;
        if (!userId) {
          setErr(tr("groups.errors_lookup_bad_response", "User lookup returned an unexpected response."));
        } else {
          setMembers((m) => [...m, { id: String(userId), email, name: displayName }]);
          setMemberInput("");
        }
      } else if (res?.status === 404) {
        setErr(tr("groups.errors_user_not_found", "User does not exist"));
      } else {
        setErr(res?.data?.message || tr("groups.errors_lookup_failed", "Could not verify the user."));
      }
    } catch {
      setErr(tr("groups.errors_lookup_failed", "Could not verify the user."));
    } finally {
      setMemberBusy(false);
    }
  };

  const removeMember = (email) => setMembers((m) => m.filter((x) => x.email !== email));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true); // <- marca que tentou submeter
    setErr("");

    // revalida depois de submitted=true
    if (!name.trim()) return;

    const payload = { name: name.trim(), users: members.map((m) => m.id) };

    setBusy(true);
    try {
      const res = await apiCall.post(createEndpoint, payload, { validateStatus: () => true });
      if (res?.status >= 200 && res?.status < 300) {
        const created = res?.data || { id: undefined, ...payload };
        onSuccess ? onSuccess(created) : navigate("/Groups");
      } else {
        setErr(res?.data?.message || tr("groups.errors.create_failed", "Could not create the group."));
      }
    } catch {
      setErr(tr("groups.errors.create_failed", "Could not create the group."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title
          text={tr("groups.create_title", "Create Group")}
          subtitle={tr("groups.create_subtitle", "Choose a name and add users by email")}
        />
      </div>

      {err && (
        <div className="mb-4 rounded-lg p-3 text-sm"
             style={{ backgroundColor: `${errorCol}1a`, color: errorCol, border: `1px solid ${errorCol}55` }}>
          {err}
        </div>
      )}

      <Card className="rounded-2xl p-6" style={{ backgroundColor: paper, border: `1px solid ${border}` }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <Input
              label={tr("common.name", "Name")}
              placeholder={tr("groups.enter_name", "e.g., Family")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name} // só aparece depois de tentar submeter
            />
          </div>

          {/* Members */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: text }}>
              {tr("groups.members", "Members (emails)")}
            </label>
<div className="flex gap-2 items-center">
  <input
    type="email"
    className="flex-1 min-w-0 px-3 py-2 rounded-md border outline-none"
    placeholder={tr("groups.enter_email", "user@mail.com")}
    value={memberInput}
    onChange={(e) => setMemberInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        lookupAndAddMember();
      }
    }}
    style={{
      backgroundColor: paper,
      color: text,
      borderColor: errors.memberInput ? errorCol : border,
    }}
  />

  <Button
    type="button"
    onClick={lookupAndAddMember}
    disabled={!memberInput || !isEmail(memberInput) || memberBusy}
    className="flex-none shrink-0 w-auto px-3 py-2 text-sm"
  >
    {memberBusy ? tr("common.checking", "Checking…") : tr("common.add", "Add")}
  </Button>
</div>

            {errors.memberInput && (
              <p className="text-xs mt-1" style={{ color: errorCol }}>
                {errors.memberInput}
              </p>
            )}

            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {members.map((m) => (
                  <span
                    key={m.email}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: hover, color: text, border: `1px solid ${border}` }}
                    title={m.name || m.email}
                  >
                    {m.name ? `${m.name} — ${m.email}` : m.email}
                    <button
                      type="button"
                      onClick={() => removeMember(m.email)}
                      className="rounded px-1"
                      title={tr("common.remove", "Remove")}
                      style={{ color: muted }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
              {tr("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? tr("common.saving", "Saving…") : tr("groups.create", "Create")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
