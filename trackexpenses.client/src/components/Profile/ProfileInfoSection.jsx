import React from "react";
import { User, Mail, Calendar, Phone, Lock } from "lucide-react";
import ProfileField from "./ProfileField";
import { useLanguage } from "../../utilis/Translate/LanguageContext";

export default function ProfileInfoSection({
  isEditing,
  formData,
  setFormData,
  theme,
}) {
  const { t } = useLanguage(); // hook para traduções

  return (
    <div className="px-6 py-8">
      <h3
        className="text-lg font-semibold mb-6"
        style={{ color: theme.colors.text.primary }}
      >
        {t("profile.personal_information")}
      </h3>

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileField
          icon={User}
          label={t("common.firstName")}
          value={formData.firstName}
          isEditing={isEditing}
          onChange={(val) => setFormData({ ...formData, firstName: val })}
          theme={theme}
        />
        <ProfileField
          icon={User}
          label={t("common.familyName")}
          value={formData.familyName}
          isEditing={isEditing}
          onChange={(val) => setFormData({ ...formData, familyName: val })}
          theme={theme}
        />
        <ProfileField
          icon={Mail}
          label={t("common.email")}
          value={formData.email}
          isEditing={false}
          theme={theme}
        />
        <ProfileField
          icon={Calendar}
          label={t("common.birthday")}
          type="date"
          value={formData.birthday}
          isEditing={isEditing}
          onChange={(val) => setFormData({ ...formData, birthday: val })}
          theme={theme}
        />
        <ProfileField
          icon={Phone}
          label={t("common.phone_number")}
          value={formData.phoneNumber}
          isEditing={isEditing}
          onChange={(val) => setFormData({ ...formData, phoneNumber: val })}
          theme={theme}
        />
        {isEditing && (
          <ProfileField
            icon={Lock}
            label={t("common.new_password")}
            type="password"
            value={formData.password}
            isEditing={true}
            onChange={(val) => setFormData({ ...formData, password: val })}
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
