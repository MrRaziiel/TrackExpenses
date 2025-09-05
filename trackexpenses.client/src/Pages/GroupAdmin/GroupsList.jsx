// src/pages/Groups/GroupList.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Plus, Users } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import Title from "../../components/Titles/TitlePage";

export default function GroupList({
  groups = [],                // [{ id, name, membersCount, description }]
  loading = false,
  error = null,
  // rota da criação:
  createTo = "/CreateGroupList",
  // como construir o link para um grupo:
  getLink = (g) => `/Groups/${g.id || g.name || ""}`,
}) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const c = theme?.colors || {};
  const bg = c.background?.default || "#0B1020";
  const paper = c.background?.paper || "#111827";
  const border = c.menu?.border || "rgba(255,255,255,0.12)";
  const text = c.text?.primary || "#E5E7EB";
  const muted = c.text?.secondary || "#94A3B8";
  const primary = c.primary?.main || "#2563EB";
  const hover = c.menu?.hoverBg || "rgba(255,255,255,0.06)";

  const tr = (k, fallback) => {
    try {
      if (!k) return fallback;
      return k.includes(".") ? t(k) : k;
    } catch {
      return fallback ?? k;
    }
  };

  const EmptyCreateCard = () => (
    <Link
      to={createTo}
      className="group relative w-full rounded-2xl border-2 border-dashed flex items-center justify-center p-10"
      style={{ borderColor: border, backgroundColor: paper, color: text }}
      title={tr("common.createGroup", "Create group")}
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${primary}22`, color: primary }}
        >
          <Plus className="h-7 w-7" />
        </div>
        <div className="text-lg font-semibold">
          {tr("common.createGroup", "Create group")}
        </div>
        <div className="text-sm" style={{ color: muted }}>
          {tr("groups.tap_to_create", "Tap to create your first group")}
        </div>
      </div>

      {/* brilho suave no hover */}
      <span
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }}
      />
    </Link>
  );

  const CreateTile = () => (
    <Link
      to={createTo}
      className="rounded-2xl border-2 border-dashed p-6 flex items-center justify-center transition-colors hover:shadow"
      style={{ borderColor: border, backgroundColor: paper, color: primary }}
      title={tr("common.createGroup", "Create group")}
    >
      <Plus className="h-6 w-6" />
    </Link>
  );

  const GroupTile = ({ g }) => (
    <Link
      to={getLink(g)}
      className="rounded-2xl p-5 transition-colors hover:shadow"
      style={{ backgroundColor: paper, color: text, border: `1px solid ${border}` }}
      title={g?.name || "Group"}
    >
      <div className="flex items-start gap-4">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${primary}22`, color: primary }}
        >
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{g?.name || tr("common.group", "Group")}</div>
          <div className="text-sm truncate" style={{ color: muted }}>
            {g?.description || tr("groups.no_description", "No description")}
          </div>
          {typeof g?.membersCount === "number" && (
            <div className="mt-2 text-xs" style={{ color: muted }}>
              {g.membersCount} {tr("groups.members", "members")}
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      <Title
        text={tr("groups.list_title", "List Groups")}
        subtitle={tr("groups.list_subtitle", "Create and manage your groups")}
      />

      {/* estados */}
      {loading && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: paper, color: muted, border: `1px solid ${border}` }}
        >
          {tr("common.loading", "Loading…")}
        </div>
      )}
      {!loading && error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{ backgroundColor: paper, color: "#ef4444", border: `1px solid ${border}` }}
        >
          {error}
        </div>
      )}

      {/* conteúdo */}
      {!loading && !error && (
        <>
          {(!groups || groups.length === 0) ? (
            <EmptyCreateCard />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {/* tile de criar */}
              <CreateTile />
              {/* grupos */}
              {groups.map((g, idx) => (
                <GroupTile key={g?.id ?? g?.name ?? idx} g={g} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
