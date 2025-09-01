import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../styles/Theme/Theme';
import apiCall from '../../services/ApiCallGeneric/apiCall';
import {
  Save, X, User, Mail, Calendar, Phone, Lock, Shield, Key, Camera, Users, Eye, EyeOff, RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../utilis/Translate/LanguageContext';

function EditUserProfile() {
  const { id, email } = useParams();
  const decodedEmail = decodeURIComponent(email || '').trim();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorSubmit, setErrorSubmit] = useState(null);

  // UX
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Imagem
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [showPassword, setShowPassword] = useState(false);

  const FILES_BASE = (import.meta.env.VITE_FILES_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001')
    .replace(/\/+$/, '');

  const currentImageUrl =
    imagePreview ||
    (user?.profileImage ? `${FILES_BASE}/${String(user.profileImage).replace(/^\/+/, '')}?t=${Date.now()}` : null);

  const displayName = `${user?.firstName || ''}`.trim() || t('common.user');

  // --- util: GET que nunca rejeita (evita 404 virar erro no console)
  const safeGet = async (url, cfg = {}) => {
    try {
      const res = await apiCall.get(url, { validateStatus: () => true, ...cfg });
      return res; // sempre resolve: res.status pode ser 200.., 404, etc.
    } catch {
      return { status: 0, data: null }; // só em erro de rede duro
    }
  };

  // --------------------- FETCH PERFIL (foto opcional) ----------------------
  const fetchProfile = async (signal) => {
    setLoading(true);
    try {
      // Perfil base: obrigatório
      const base = await apiCall.get('/User/GetProfile', {
        params: { UserEmail: decodedEmail },
        signal,
        validateStatus: s => s >= 200 && s < 300
      });

      const data = base?.data || {};
      const mappedUser = {
        id: data.Id ?? data.id,
        email: data.Email ?? data.email,
        firstName: data.FirstName ?? data.firstName,
        familyName: data.FamilyName ?? data.familyName,
        birthday: data.Birthday ?? data.birthday,
        phoneNumber: data.PhoneNumber ?? data.phoneNumber,
        groupName: data.GroupName || '',
        groupRole: data.GroupRole || data.Role || 'Member',
        groupId: data.GroupId || '',
        profileImage: '',
        groupMembers: data.GroupMembers || []
      };

      // Enriquecimento com nome/foto (opcional, nunca rejeita)
      const np = await safeGet(`/User/GetPhotoProfileAndName/${encodeURIComponent(decodedEmail)}`, { signal });
      if (np.status >= 200 && np.status < 300) {
        const fn = np?.data?.FirstName ?? np?.data?.firstName;
        const ln = np?.data?.FamilyName ?? np?.data?.familyName;
        const path = np?.data?.PhotoPath ?? np?.data?.photoPath ?? np?.data?.path;
        if (fn) mappedUser.firstName = fn;
        if (ln) mappedUser.familyName = ln;
        if (path && path !== 'NoPhoto') mappedUser.profileImage = path;
      }
      // Fallback de foto (opcional)
      if (!mappedUser.profileImage) {
        const fp = await safeGet(`/User/GetPhotoProfile/${encodeURIComponent(decodedEmail)}`, { signal });
        if (fp.status >= 200 && fp.status < 300) {
          const photoPath = fp?.data?.photoPath ?? fp?.data?.PhotoPath ?? fp?.data?.path;
          if (photoPath && photoPath !== 'NoPhoto') mappedUser.profileImage = photoPath;
        }
      }

      setUser(mappedUser);
      setFormData({ ...mappedUser, birthday: mappedUser.birthday || '' });
      setCurrentGroupMembers(mappedUser.groupMembers || []);
      setLoadFailed(false);
      setErrorSubmit(null);
    } catch {
      setLoadFailed(true); // só falha se o perfil base falhar
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!decodedEmail || !id) {
      setLoading(false);
      setLoadFailed(true);
      return;
    }
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [decodedEmail, id]);

  // --------------------- IMAGEM: selecionar / remover / upload -------------
  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setImageError(t('profile.image_invalid_format'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('profile.image_too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    setSelectedImage(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUser(prev => prev ? { ...prev, profileImage: null } : prev);
    setFormData(prev => ({ ...prev, profileImage: null }));
  };

  const uploadImage = async () => {
    if (!selectedImage) return user?.profileImage ?? null;

    const form = new FormData();
    form.append('Photo', selectedImage);

    try {
      const response = await apiCall.post(
        `/User/UploadProfileImage/${id}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' }, validateStatus: s => s >= 200 && s < 300 }
      );
      const partialPath =
        response?.data?.partialPath ||
        response?.data?.PhotoPath ||
        response?.data?.photoPath ||
        response?.data?.path;

      if (!partialPath) {
        setImageError(t('profile.image_upload_error'));
        return user?.profileImage ?? null;
      }

      setSelectedImage(null);
      setImagePreview(null);
      setUser(prev => prev ? { ...prev, profileImage: partialPath } : prev);
      setFormData(prev => ({ ...prev, profileImage: partialPath }));
      return partialPath;
    } catch {
      setImageError(t('profile.image_upload_error'));
      return user?.profileImage ?? null;
    }
  };

  // --------------------- SAVE / CANCEL / RETRY -----------------------------
  const handleSave = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    if (loadFailed || !user) {
      setErrorSubmit("We couldn't load your profile. Please try again.");
      return;
    }

    setErrorSubmit(null);

    let finalImagePath = user?.profileImage ?? null;
    if (selectedImage) finalImagePath = await uploadImage();

    const payload = {
      ...formData,
      birthday: formData.birthday || undefined,
      profileImage: finalImagePath
    };

    try {
      await apiCall.put('/User/EditUser', payload, { validateStatus: s => s >= 200 && s < 300 });
      setUser(prev => prev ? ({ ...prev, ...payload }) : payload);
      setFormData(prev => ({ ...prev, ...payload }));
      navigate('/users');
    } catch {
      setErrorSubmit("We couldn't save your changes. Please try again.");
    }
  };

  const handleCancel = () => navigate('/users');

  const handleRetry = async () => {
    setShowErrors(true);
    const controller = new AbortController();
    await fetchProfile(controller.signal);
  };

  // --------------------- RENDER --------------------------------------------
  const showErrorBanner = showErrors && (errorSubmit || loadFailed);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header com botões à direita */}
      <div className="flex items-center">
        <div className="ml-auto flex space-x-3">
          {loadFailed && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-2 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              style={{ borderColor: theme.colors.secondary.light }}
              title="Retry loading profile"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </button>
          )}
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <X className="h-5 w-5 mr-2" />
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium hover:opacity-90 transition-colors duration-200"
            style={{ backgroundColor: theme.colors.success.main }}
          >
            <Save className="h-5 w-5 mr-2" />
            {t('common.save_Changes')}
          </button>
        </div>
      </div>

      {showErrorBanner && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            {errorSubmit || "We couldn't load your profile. Please try again."}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleRetry}
              className="px-3 py-1 rounded-md text-white"
              style={{ backgroundColor: theme.colors.primary.main }}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-md overflow-hidden"
        style={{ backgroundColor: theme.colors.background.paper, opacity: loadFailed ? 0.6 : 1 }}
      >
        {/* Profile Header */}
        <div className="px-6 py-8 border-b" style={{ borderColor: theme.colors.secondary.light }}>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${loadFailed ? 'pointer-events-none' : 'cursor-pointer'}`}
                style={{ backgroundColor: theme.colors.primary.main }}
                onClick={!loadFailed ? () => fileInputRef.current?.click() : undefined}
                title={t('common.click_to_change_photo')}
                aria-label={t('common.click_to_change_photo')}
              >
                {currentImageUrl ? (
                  <img src={currentImageUrl} alt={t('common.photo_alt')} className="w-full h-full object-cover" />
                ) : (
                  (displayName.charAt(0) || '?').toUpperCase()
                )}
                {!loadFailed && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>

              {(currentImageUrl || imagePreview) && !loadFailed && (
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setUser(prev => prev ? { ...prev, profileImage: null } : prev);
                    setFormData(prev => ({ ...prev, profileImage: null }));
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title={t('common.remove_photo')}
                  aria-label={t('common.remove_photo')}
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImageError(null);
                  const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                  if (!validTypes.includes(file.type)) {
                    setImageError(t('profile.image_invalid_format'));
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    setImageError(t('profile.image_too_large'));
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = ev => setImagePreview(ev.target.result);
                  reader.readAsDataURL(file);
                  setSelectedImage(file);
                }}
                className="hidden"
                disabled={loadFailed}
              />

              {imageError && !loadFailed && (
                <p className="text-xs mt-2 text-red-600">{imageError}</p>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
                {displayName}
              </h2>
              <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
                {user?.email || t('common.not_provided')}
              </p>
              <div className="mt-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: theme.colors.primary.light + '30', color: theme.colors.primary.main }}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {user?.groupRole || t('common.member')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-6 py-8">
          <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            {t('profile.personal_information')}
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + '20' }}>
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('common.firstName')}
                </h4>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary
                  }}
                  placeholder={t('profile.enter_first_name')}
                  disabled={loadFailed}
                />
              </div>
            </div>

            {/* Family Name */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + '20' }}>
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('common.familyName')}
                </h4>
                <input
                  type="text"
                  value={formData.familyName || ''}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary
                  }}
                  placeholder={t('profile.enter_family_name')}
                  disabled={loadFailed}
                />
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + '20' }}>
                <Mail className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('profile.email')}
                </h4>
                <p className="text-base" style={{ color: theme.colors.text.primary }}>
                  {user?.email || t('common.not_provided')}
                </p>
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.secondary.light + '20' }}>
                <Calendar className="h-5 w-5" style={{ color: theme.colors.secondary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('common.birthday')}
                </h4>
                <input
                  type="date"
                  value={formData.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary
                  }}
                  disabled={loadFailed}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.success.light + '20' }}>
                <Phone className="h-5 w-5" style={{ color: theme.colors.success.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('common.phone_number')}
                </h4>
                <input
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.secondary.light,
                    color: theme.colors.text.primary
                  }}
                  placeholder={t('profile.enter_phone_number')}
                  disabled={loadFailed}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex items-start space-x-4">
              <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.error.light + '20' }}>
                <Lock className="h-5 w-5" style={{ color: theme.colors.error.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  {t('common.new_Password')}
                </h4>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: theme.colors.secondary.light,
                      color: theme.colors.text.primary
                    }}
                    placeholder={t('profile.password_leave_empty')}
                    disabled={loadFailed}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2"
                    style={{ color: theme.colors.text.secondary, cursor: 'pointer' }}
                    title={showPassword ? t('profile.hide_password') : t('profile.show_password')}
                    aria-label={showPassword ? t('profile.hide_password') : t('profile.show_password')}
                    disabled={loadFailed}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Group Information */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: theme.colors.secondary.light }}>
            <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
              {t('profile.group_information')}
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.success.light + '20' }}>
                  <Shield className="h-5 w-5" style={{ color: theme.colors.success.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    {t('profile.group_name')}
                  </h4>
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.groupName || t('common.member')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.primary.light + '20' }}>
                  <Key className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    {t('profile.invite_code')}
                  </h4>
                  <p className="text-base font-mono" style={{ color: theme.colors.text.primary }}>
                    {user?.groupId || t('common.not_provided')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.success.light + '20' }}>
                  <Shield className="h-5 w-5" style={{ color: theme.colors.success.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    {t('profile.group_role')}
                  </h4>
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.groupRole || t('common.member')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-2 rounded-lg" style={{ backgroundColor: theme.colors.secondary.light + '20' }}>
                  <Users className="h-5 w-5" style={{ color: theme.colors.secondary.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    {t('profile.group_members')} ({currentGroupMembers.length})
                  </h4>
                </div>
              </div>

              <div className="space-y-2 ml-12">
                {currentGroupMembers.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    {t('profile.no_group_members')}
                  </p>
                ) : (
                  currentGroupMembers.map((member, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const updated = [...currentGroupMembers];
                          updated.splice(index, 1);
                          setCurrentGroupMembers(updated);
                        }}
                        className="px-2 py-1 text-sm rounded-md text-white"
                        style={{ backgroundColor: theme.colors.error.main }}
                        title={t('profile.remove_member')}
                        aria-label={t('profile.remove_member')}
                        disabled={loadFailed}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span style={{ color: theme.colors.text.primary }}>{member}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading && !showErrors && (
        <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
          Loading…
        </p>
      )}
    </div>
  );
}

export default EditUserProfile;
