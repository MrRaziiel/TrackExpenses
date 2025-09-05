import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Title from "../../components/Titles/TitlePage";
import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import TextArea from "../../components/Form/TextArea"
import Select from "../../components/Form/Select";
import Button from "../../components/Buttons/Button";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";


// util simples para e-mails
const isEmail = (s) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());

export default function CreateGroup({
  createEndpoint = "/Group/Create",
  onSuccess, // (created) => void
}) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const c = theme?.colors || {};
  const paper = c.background?.paper || "#111827";
  const border = c.menu?.border || "rgba(255,255,255,0.12)";
  const text = c.text?.primary || "#E5E7EB";
  const muted = c.text?.secondary || "#94A3B8";
  const primary = c.primary?.main || "#2563EB";
  const errorCol = c.error?.main || "#EF4444";
  const hover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";

  // i18n helper
  const tr = (k, fallback) => {
    try { return k?.includes(".") ? t(k) : (k ?? fallback); } catch { return fallback ?? k; }
  };

  // form state
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [privacy, setPrivacy] = useState("private"); // 'public' | 'private'
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // validações
  const errors = useMemo(() => {
    const e = {};
    if (!name.trim()) e.name = tr("groups.errors.name_required", "Name is required");
    if (memberInput && !isEmail(memberInput)) e.memberInput = tr("groups.errors.invalid_email", "Invalid email");
    return e;
  }, [name, memberInput]);

  const addMember = () => {
    const email = memberInput.trim();
    if (!email) return;
    if (!isEmail(email)) return;
    if (members.includes(email)) return;
    setMembers((m) => [...m, email]);
    setMemberInput("");
  };

  const removeMember = (email) => {
    setMembers((m) => m.filter((x) => x !== email));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: name.trim(),
      description: desc.trim(),
      privacy, // 'private' | 'public'
      members, // string[]
    };

    setBusy(true);
    try {
      const res = await apiCall.post(createEndpoint, payload, {
        validateStatus: () => true,
      });
      if (res?.status >= 200 && res?.status < 300) {
        const created = res?.data || { id: undefined, ...payload };
        if (onSuccess) onSuccess(created);
        else navigate("/Groups");
      } else {
        setErr(
          res?.data?.message ||
            tr("groups.errors.create_failed", "Could not create the group.")
        );
      }
    } catch {
      setErr(tr("groups.errors.create_failed", "Could not create the group."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Title
          text={tr("groups.create_title", "Create Group")}
          subtitle={tr("groups.create_subtitle", "Define a name, privacy and invite members")}
        />
      </div>

      {err && (
        <div
          className="mb-4 rounded-lg p-3 text-sm"
          style={{ backgroundColor: `${errorCol}1a`, color: errorCol, border: `1px solid ${errorCol}55` }}
        >
          {err}
        </div>
      )}

      <Card
        className="rounded-2xl p-6"
        style={{ backgroundColor: paper, border: `1px solid ${border}` }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Input
                label={tr("common.name", "Name")}
                placeholder={tr("groups.placeholders.name", "e.g., Family")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
              />
            </div>

            <div>
              <Select
                label={tr("groups.privacy", "Privacy")}
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                options={[
                  { value: "private", label: tr("groups.private", "Private") },
                  { value: "public", label: tr("groups.public", "Public") },
                ]}
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                label={tr("common.description", "Description")}
                placeholder={tr("groups.placeholders.description", "Optional description for the group")}
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          {/* members */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: text }}>
              {tr("groups.members", "Members (emails)")}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                className="flex-1 px-3 py-2 rounded-md border outline-none"
                placeholder={tr("groups.placeholders.email", "user@mail.com")}
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                style={{
                  backgroundColor: paper,
                  color: text,
                  borderColor: errors.memberInput ? errorCol : border,
                }}
              />
              <Button
                type="button"
                onClick={addMember}
                disabled={!memberInput || !isEmail(memberInput)}
              >
                {tr("common.add", "Add")}
              </Button>
            </div>
            {errors.memberInput && (
              <p className="text-xs mt-1" style={{ color: errorCol }}>
                {errors.memberInput}
              </p>
            )}

            {/* chips */}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {members.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded-full text-sm"
                    style={{ backgroundColor: hover, color: text, border: `1px solid ${border}` }}
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => removeMember(m)}
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(-1)}
            >
              {tr("common.cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={busy || !!errors.name}>
              {busy ? tr("common.saving", "Saving…") : tr("groups.create", "Create")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
