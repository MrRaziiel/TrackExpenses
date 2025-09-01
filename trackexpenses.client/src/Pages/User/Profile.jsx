import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import AuthContext from "../../services/Authentication/AuthContext";
import { useTheme } from "../../styles/Theme/Theme";
import apiCall from "../../services/ApiCallGeneric/apiCall";

import ProfileAvatar from "../../components/Profile/ProfileAvatar";
import ProfileInfoSection from "../../components/Profile/ProfileInfoSection";
import ProfileGroupSection from "../../components/Profile/ProfileGroupSection";
import ProfileHeader from "../../components/Profile/ProfileHeader";
import Title from "../../components/Titles/TitlePage";

/* helpers */
const normPath = (p) =>
  (p || "").toString().replace(/\\/g, "/").replace(/^\/+/, "");
const stripTrailing = (s) => (s || "").replace(/\/+$/g, "");
const buildFileUrl = (filesBase, partialOrAbsolute) => {
  if (!partialOrAbsolute) return null;
  const p = String(partialOrAbsolute);
  if (/^https?:\/\//i.test(p))
    return `${p}${p.includes("?") ? "" : `?t=${Date.now()}`}`;
  const root = stripTrailing(filesBase || "");
  return `${root}/${normPath(p)}?t=${Date.now()}`;
};

function ProfilePage() {
  const { auth, setAuth } = useContext(AuthContext);
  const { theme } = useTheme();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "https://localhost:5001/api";
  const FILES_BASE =
    import.meta.env.VITE_FILES_BASE_URL || "https://localhost:5001";

  const currentImageUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (user?.profileImage) return buildFileUrl(FILES_BASE, user.profileImage);
    if (auth?.path) return auth.path;
    return null;
  }, [imagePreview, user?.profileImage, auth?.path, FILES_BASE]);

  const firstName = user?.firstName ?? "";
  const familyName = user?.familyName ?? "";

  useEffect(() => {
    let cancelled = false;

    async function fetchData(userEmail) {
      setLoading(true);
      setErrorSubmit(null);

      let baseUser = {
        id: undefined,
        email: userEmail,
        firstName: "",
        familyName: "",
        birthday: "",
        phoneNumber: "",
        groupName: "",
        groupRole: "Member",
        groupId: "",
        profileImage: "",
        groupMembers: [],
      };

      try {
        const res = await apiCall.get("/User/GetProfile", {
          params: { UserEmail: userEmail },
          validateStatus: (s) =>
            (s >= 200 && s < 300) || s === 404 || s === 400,
        });
        if (res?.status >= 200 && res?.status < 300 && res?.data) {
          const d = res.data;
          baseUser = {
            id: d.id ?? d.Id,
            email: d.email ?? d.Email ?? userEmail,
            firstName: d.firstName ?? d.FirstName ?? "",
            familyName: d.familyName ?? d.FamilyName ?? "",
            birthday: d.birthday ?? d.Birthday ?? "",
            phoneNumber: d.phoneNumber ?? d.PhoneNumber ?? "",
            groupName: d.groupName ?? d.GroupName ?? "",
            groupRole: d.groupRole ?? d.Role ?? "Member",
            groupId: d.groupId ?? d.GroupId ?? "",
            profileImage: "",
            groupMembers: d.groupMembers ?? [],
          };
        }
      } catch {
        // segue com baseUser
      }

      if (!cancelled) {
        setUser(baseUser);
        setFormData({ ...baseUser, birthday: baseUser.birthday || "" });
      }

      try {
        const res2 = await apiCall.get(
          `/User/GetPhotoProfileAndName/${encodeURIComponent(userEmail)}`,
          { validateStatus: (s) => (s >= 200 && s < 300) || s === 404 }
        );
        if (!cancelled && res2?.status !== 404) {
          const data = res2?.data || {};
          const photoPath = data.PhotoPath ?? data.photoPath ?? "";
          const fName = data.FirstName ?? data.firstName ?? "";

          if (photoPath && photoPath !== "NoPhoto") {
            const relative = normPath(photoPath);
            const absolute = buildFileUrl(FILES_BASE, relative);
            setUser((p) => ({ ...p, profileImage: relative }));
            setFormData((p) => ({ ...p, profileImage: relative }));
            setAuth?.((prev) => ({ ...prev, path: absolute }));
          }
          if (fName) {
            setAuth?.((prev) => ({
              ...prev,
              firstName: prev.firstName || fName,
            }));
          }
        }
      } catch {
        // ignora
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const email = auth?.Email;
    if (!email) {
      setUser({
        email: "",
        firstName: "",
        familyName: "",
        birthday: "",
        phoneNumber: "",
        groupName: "",
        groupRole: "Member",
        groupId: "",
        profileImage: "",
        groupMembers: [],
      });
      setFormData({
        email: "",
        firstName: "",
        familyName: "",
        birthday: "",
        phoneNumber: "",
        groupName: "",
        groupRole: "Member",
        groupId: "",
        profileImage: "",
        groupMembers: [],
      });
      setLoading(false);
      return;
    }

    fetchData(email);
    return () => {
      cancelled = true;
    };
  }, [auth?.Email, setAuth, FILES_BASE]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    setImageError(null);
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setImageError("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image size must be less than 5MB");
      return;
    }
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const uploadImage = async () => {
    if (!selectedImage || !user?.id) return null;
    const imageFormData = new FormData();
    imageFormData.append("photo", selectedImage);
    try {
      const response = await apiCall.post(
        `/User/UploadProfileImage/${user.id}`,
        imageFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const partialPath = normPath(
        response?.data?.partialPath || response?.data?.PartialPath || ""
      );
      if (partialPath) return partialPath;
      setImageError("Image uploaded but no path returned");
      return null;
    } catch {
      setImageError("Error to upload image");
      return null;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setErrorSubmit(null);
    setImageError(null);
    setSubmitting(true);

    let imageUrl = formData.profileImage || user?.profileImage || "";
    if (selectedImage) {
      const uploadedPath = await uploadImage();
      if (!uploadedPath) {
        setSubmitting(false);
        return;
      }
      imageUrl = uploadedPath;
    }

    const payload = {
      ...formData,
      birthday: formData.birthday || undefined,
      ...(formData.password ? { password: formData.password } : {}),
      profileImage: imageUrl,
    };

    try {
      const response = await apiCall.put("/User/EditUser", payload, {
        headers: { "Content-Type": "application/json" },
        validateStatus: (s) =>
          (s >= 200 && s < 300) || s === 400 || s === 404 || s === 409,
      });

      if (!(response?.status >= 200 && response?.status < 300)) {
        setErrorSubmit(response?.data?.message || "Error to save user data");
      } else {
        const updatedUser = { ...formData, profileImage: imageUrl };
        delete updatedUser.password;

        setUser(updatedUser);
        setFormData(updatedUser);
        setIsEditing(false);
        setSelectedImage(null);
        setImagePreview(null);

        // URL absoluto (sem /api) + cache-buster
        const absolute = buildFileUrl(FILES_BASE, imageUrl);

        // 1) propaga no contexto
        setAuth?.((prev) => ({
          ...prev,
          firstName: updatedUser.firstName ?? prev.firstName,
          path: absolute || prev.path,
        }));

        // 2) dispara evento global para listeners (SideBar/TopBar)
        window.dispatchEvent(
          new CustomEvent("avatar-updated", { detail: { url: absolute } })
        );
      }
    } catch {
      setErrorSubmit("Error to save user data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!user) return;
    setFormData({ ...user, birthday: user.birthday || "" });
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Title text="Profile" />
        <div className="animate-pulse space-y-4 mt-6">
          <div className="h-40 w-full rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <ProfileHeader
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onCancel={handleCancel}
        onSave={handleSave}
        submitting={submitting}
        theme={theme}
      />

      {errorSubmit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 my-4">
          <p className="text-red-800">{errorSubmit}</p>
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-md overflow-hidden mt-6"
        style={{ backgroundColor: theme.colors.background.paper }}
      >
        <ProfileAvatar
          currentImageUrl={currentImageUrl}
          firstName={firstName}
          familyName={familyName}
          isEditing={isEditing}
          fileInputRef={fileInputRef}
          onFileSelect={handleImageSelect}
          onRemoveImage={() => {
            setSelectedImage(null);
            setImagePreview(null);
            setFormData((prev) => ({ ...prev, profileImage: "" }));
          }}
          imageError={imageError}
          theme={theme}
        />

        <ProfileInfoSection
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          theme={theme}
        />

        <ProfileGroupSection
          isEditing={isEditing}
          formData={formData}
          setFormData={setFormData}
          user={user}
          theme={theme}
        />
      </div>
    </div>
  );
}

export default ProfilePage;
