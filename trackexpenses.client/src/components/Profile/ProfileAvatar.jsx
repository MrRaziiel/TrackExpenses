import React, { useEffect, useState } from "react";
import { Camera, X, Shield } from "lucide-react";

function getInitials(firstName = "", familyName = "") {
  const f = (firstName || "").toString().trim();
  const l = (familyName || "").toString().trim();
  const fi = f.length ? f[0].toUpperCase() : "";
  const li = l.length ? l[0].toUpperCase() : "";
  return fi + li || "U";
}

export default function ProfileAvatar({
  currentImageUrl,
  firstName = "",
  familyName = "",
  isEditing = false,
  fileInputRef,
  onFileSelect,
  onRemoveImage,
  imageError,
  theme,
}) {
  const initials = getInitials(firstName, familyName);
  const fullName = [firstName, familyName].filter(Boolean).join(" ") || "User";

  // Se a imagem 404/falhar, escondemos o <img> e mostramos as iniciais
  const [showImg, setShowImg] = useState(!!currentImageUrl);
  useEffect(() => {
    setShowImg(!!currentImageUrl);
  }, [currentImageUrl]);
  console.log(showImg);
  return (
    <div
      className="px-6 py-8 border-b"
      style={{ borderColor: theme.colors.secondary.light }}
    >
      <div className="flex items-center gap-6">
        <div className="relative">
          <div
            className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${
              isEditing ? "cursor-pointer" : ""
            }`}
            style={{ backgroundColor: theme.colors.primary.main }}
            onClick={() => isEditing && fileInputRef?.current?.click()}
          >
            {currentImageUrl && showImg ? (
              <img
                src={currentImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setShowImg(false)}
              />
            ) : (
              <span>{initials}</span>
            )}

            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
          </div>

          {isEditing && currentImageUrl && showImg && (
            <button
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              aria-label="Remove profile image"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h2
            className="text-2xl font-bold mb-1 truncate"
            style={{ color: theme.colors.text.primary }}
          >
            {fullName}
          </h2>

          {imageError && (
            <p className="text-sm mt-2 text-red-600">{imageError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
