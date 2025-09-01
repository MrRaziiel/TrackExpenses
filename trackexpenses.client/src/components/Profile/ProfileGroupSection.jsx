import React, { useRef, useState } from "react";
import { Shield, Key, Users, Copy, Check, X } from "lucide-react";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function ProfileGroupSection({
  isEditing,
  formData,
  setFormData,
  user,
  theme,
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const currentGroupMembers = isEditing
    ? formData.groupMembers || []
    : user?.groupMembers || [];

  const removeGroupMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      groupMembers: (prev.groupMembers || []).filter((_, i) => i !== index),
    }));
  };

  const handleCopy = async () => {
    if (!user?.groupId) return;
    try {
      await navigator.clipboard.writeText(String(user.groupId));
      setCopied(true);
      window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div
      className="px-6 py-8 border-t"
      style={{ borderColor: theme.colors.secondary.light }}
    >
      <h3
        className="text-lg font-semibold mb-6"
        style={{ color: theme.colors.text.primary }}
      >
        {t("profile.group_information")}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Group Name */}
        <div className="flex items-start space-x-4">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: theme.colors.success.light + "20" }}
          >
            <Shield
              className="h-5 w-5"
              style={{ color: theme.colors.success.main }}
            />
          </div>
          <div className="flex-1">
            <h4
              className="text-sm font-medium mb-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {t("profile.group_name")}
            </h4>
            <p
              className="text-base"
              style={{ color: theme.colors.text.primary }}
            >
              {user?.groupName || t("profile.not_provided")}
            </p>
          </div>
        </div>

        {/* Invite Code */}
        <div className="flex items-start space-x-4">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: theme.colors.primary.light + "20" }}
          >
            <Key
              className="h-5 w-5"
              style={{ color: theme.colors.primary.main }}
            />
          </div>
          <div className="flex-1">
            <h4
              className="text-sm font-medium mb-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {t("profile.invite_code")}
            </h4>
            <div className="flex items-center gap-2">
              <p
                className="text-base font-mono"
                style={{ color: theme.colors.text.primary }}
              >
                {user?.groupId || t("profile.not_provided")}
              </p>
              {user?.groupId && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center px-2 py-1 rounded-md border text-sm"
                  style={{ borderColor: theme.colors.secondary.light }}
                  aria-label={t("profile.copy_invite_code")}
                  title={t("profile.copy_invite_code")}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group Role */}
        <div className="flex items-start space-x-4">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: theme.colors.success.light + "20" }}
          >
            <Shield
              className="h-5 w-5"
              style={{ color: theme.colors.success.main }}
            />
          </div>
          <div className="flex-1">
            <h4
              className="text-sm font-medium mb-1"
              style={{ color: theme.colors.text.secondary }}
            >
              {t("profile.group_role")}
            </h4>
            <p
              className="text-base"
              style={{ color: theme.colors.text.primary }}
            >
              {user?.groupRole || t("profile.not_provided")}
            </p>
          </div>
        </div>
      </div>

      {/* Group Members */}
      <div className="mt-6">
        <div className="flex items-center space-x-4 mb-4">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: theme.colors.secondary.light + "20" }}
          >
            <Users
              className="h-5 w-5"
              style={{ color: theme.colors.secondary.main }}
            />
          </div>
          <div className="flex-1">
            <h4
              className="text-sm font-medium"
              style={{ color: theme.colors.text.secondary }}
            >
              {t("profile.group_members")} ({currentGroupMembers.length})
            </h4>
          </div>
        </div>

        <div className="space-y-2 ml-12">
          {currentGroupMembers.length === 0 ? (
            <p
              className="text-sm"
              style={{ color: theme.colors.text.secondary }}
            >
              {t("profile.no_group_members")}
            </p>
          ) : (
            currentGroupMembers.map((member, index) => (
              <div key={index} className="flex items-center space-x-2">
                {!isEditing ? (
                  <p
                    className="text-base"
                    style={{ color: theme.colors.text.primary }}
                  >
                    • {member}
                  </p>
                ) : (
                  <button
                    onClick={() => removeGroupMember(index)}
                    className="px-2 py-1 text-sm rounded-md text-white"
                    style={{ backgroundColor: theme.colors.error.main }}
                    aria-label={`${t("profile.remove_member")}: ${member}`}
                    title={`${t("profile.remove_member")}: ${member}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
