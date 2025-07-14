import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import AuthContext from '../../Authentication/AuthContext';
import { useTheme } from '../../Theme/Theme';
import apiCall from '../../../hooks/apiCall';
import {
  Save, X, User, Mail, Calendar, Phone, Lock, Users, Shield, Key, Camera
} from 'lucide-react';

function EditUserProfile() {
  const { id, email } = useParams(); // <-- RECEBE ID E EMAIL DA URL
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext);

  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({});
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall.get('/User/GetProfile', {
          params: { UserEmail: email }
        });

        if (res.data) {
          const userData = res.data;
          setUser(userData);
          setFormData({ ...userData, birthday: userData.birthDay || '' });

          try {
            const res2 = await apiCall.get(`/User/GetPhotoProfile/${email}`);
            const photoPath = res2.data?.photoPath;
            if (photoPath && photoPath !== 'NoPhoto') {
              setUser(prev => ({ ...prev, profileImage: photoPath }));
            }
          } catch (err) {
            console.error("Erro ao buscar foto:", err);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        setUser({});
      }
    };

    fetchData();
  }, [email]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setImageError('Formato inválido. Usa JPG ou PNG.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Imagem deve ter menos de 5MB');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const imageFormData = new FormData();
    imageFormData.append('Photo', selectedImage);

    try {
      const response = await apiCall.post(`/User/UploadProfileImage/${id}`, imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data.partialPath;
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      setImageError('Erro ao enviar imagem');
      return null;
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);

    let imageUrl = user.profileImage;

    if (selectedImage) {
      imageUrl = await uploadImage();
      if (!imageUrl) return;
    }

    const payload = {
      ...formData,
      birthday: formData.birthday || undefined,
      profileImage: imageUrl
    };

    try {
      const response = await apiCall.put('/User/EditUser', payload);
      if (!response.data) {
        setErrorSubmit('Erro ao atualizar');
        return;
      }

      setUser({ ...formData, profileImage: imageUrl });
      setFormData({ ...formData, profileImage: imageUrl });
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      setErrorSubmit(error?.response?.data?.message || 'Erro ao guardar');
    }
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5285";
  const currentImageUrl = imagePreview || (user?.profileImage ? `${API_BASE}/${user.profileImage}` : null);
  const displayName = `${user?.firstName || ''}`.trim() || 'User';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
          Edit User
        </h1>
        <button
          onClick={handleSave}
          className="inline-flex items-center px-4 py-2 rounded-lg text-white"
          style={{ backgroundColor: theme.colors.success.main }}
        >
          <Save className="h-5 w-5 mr-2" />
          Save Changes
        </button>
      </div>

      {errorSubmit && (
        <div className="bg-red-100 text-red-800 p-3 rounded">{errorSubmit}</div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6" style={{ backgroundColor: theme.colors.background.paper }}>
        <div className="flex items-center space-x-6">
          <div className="relative cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="h-24 w-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: theme.colors.primary.main }}>
              {currentImageUrl ? (
                <img src={currentImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              {displayName}
            </h2>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">First Name</label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            />
          </div>

          {/* Family Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Family Name</label>
            <input
              type="text"
              value={formData.familyName || ''}
              onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Phone</label>
            <input
              type="text"
              value={formData.phoneNumber || ''}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            />
          </div>

          {/* Birthday */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Birthday</label>
            <input
              type="date"
              value={formData.birthday || ''}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              className="w-full px-3 py-2 rounded-md border border-gray-300"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditUserProfile;
