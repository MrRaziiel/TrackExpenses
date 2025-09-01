import React, { useMemo, useState, useEffect } from "react";
import { buildAssetUrl } from "../../utils/url";

// Avatar pequeno e reutilizável (SideBar / TopBar).
// Props:
// - auth: objeto do AuthContext (opcional)
// - src: caminho/URL preferencial (opcional; tem prioridade sobre auth.path)
// - firstName, familyName, email: para iniciais e texto alternativo
// - size: "sm" | "md" | "lg"
export default function UserAvatar({
  auth,
  src,
  firstName,
  familyName,
  email,
  size = "sm",
  className = "",
}) {
  const [imgOk, setImgOk] = useState(true);

  const initials = useMemo(() => {
    const f = (firstName ?? auth?.firstName ?? "").toString().trim();
    const l = (familyName ?? auth?.familyName ?? "").toString().trim();
    const mail = (email ?? auth?.Email ?? auth?.email ?? "U").toString().trim();
    const fi = f ? f[0].toUpperCase() : (mail[0] || "U").toUpperCase();
    const li = l ? l[0].toUpperCase() : "";
    return fi + li || "U";
  }, [firstName, familyName, email, auth]);

  const avatarSrc = useMemo(() => {
    const candidate =
      src ||
      auth?.path ||
      auth?.photoPath ||
      auth?.profileImage ||
      auth?.image ||
      auth?.photo;

    return candidate ? buildAssetUrl(candidate) : null;
  }, [src, auth]);

  useEffect(() => {
    // sempre que mudar o src, volta a tentar carregar
    setImgOk(true);
  }, [avatarSrc]);

  const sizeClasses =
    size === "lg"
      ? "h-12 w-12 text-xl"
      : size === "md"
      ? "h-10 w-10 text-base"
      : "h-8 w-8 text-sm";

  return (
    <div
      className={`rounded-full overflow-hidden bg-blue-500 text-white flex items-center justify-center font-bold ${sizeClasses} ${className}`}
      title={email || auth?.Email || auth?.email || ""}
    >
      {avatarSrc && imgOk ? (
        <img
          src={avatarSrc}
          alt="avatar"
          className="w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
