import React from "react";
import { Edit3, Save, X } from "lucide-react";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function ProfileHeader({
  isEditing,
  onEdit,
  onCancel,
  onSave,
  submitting,
  theme,
}) {
  const { t } = useLanguage();

  const colors = theme?.colors ?? {
    text: { primary: "#fff" },
    primary: { main: "#3b82f6" },
    success: { main: "#16a34a" },
  };

  return (
    <div className="flex justify-between items-center">
      {/* único título */}
      <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
        {t("profile.title")}
      </h1>

      {/* botões */}
      {!isEditing ? (
        <button
          onClick={onEdit}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium hover:opacity-90 transition-colors duration-200"
          style={{ backgroundColor: colors.primary.main }}
        >
          <Edit3 className="h-5 w-5 mr-2" />
          {t("profile.edit_Profile")}
        </button>
      ) : (
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <X className="h-5 w-5 mr-2" />
            {t("common.cancel")}
          </button>
          <button
            onClick={onSave}
            disabled={submitting}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium hover:opacity-90 transition-colors duration-200 disabled:opacity-60"
            style={{ backgroundColor: colors.success.main }}
          >
            <Save className="h-5 w-5 mr-2" />
            {submitting ? t("common.saving") : t("common.save_Changes")}
          </button>
        </div>
      )}
    </div>
  );
}
