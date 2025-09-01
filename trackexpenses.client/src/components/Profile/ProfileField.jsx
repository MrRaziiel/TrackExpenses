import React from "react";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function ProfileField({
  icon: Icon,
  label, // a label agora deve vir como key de tradução ex: "profile.first_name"
  value,
  isEditing,
  onChange,
  type = "text",
  theme,
}) {
  const { t } = useLanguage();

  return (
    <div className="flex items-start space-x-4">
      <div
        className="p-2 rounded-lg"
        style={{ backgroundColor: theme.colors.primary.light + "20" }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: theme.colors.primary.main }}
        />
      </div>
      <div className="flex-1">
        <h4
          className="text-sm font-medium mb-1"
          style={{ color: theme.colors.text.secondary }}
        >
          {t(label)}
        </h4>
        {!isEditing ? (
          <p className="text-base" style={{ color: theme.colors.text.primary }}>
            {value || t("profile.not_provided")}
          </p>
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              backgroundColor: theme.colors.background.paper,
              borderColor: theme.colors.secondary.light,
              color: theme.colors.text.primary,
            }}
          />
        )}
      </div>
    </div>
  );
}
