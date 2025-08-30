import React, { useContext, useState, useEffect, useRef } from 'react';
import AuthContext from '../../services/Authentication/AuthContext';
import { useTheme } from '../../styles/Theme/Theme';
import apiCall from '../../services/ApiCallGeneric/apiCall';
import {
  Edit3, Save, X, User, Mail, Calendar, Phone, Lock, Users, Shield, Key, Camera
} from 'lucide-react';

function ProfilePage() {
  const [user, setUser] = useState({});
  const { auth, setAuth } = useContext(AuthContext);
  const { theme } = useTheme();

  const [errorSubmit, setErrorSubmit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setErrorSubmit(null);
      try {
        const res = await apiCall.get('/User/GetProfile', {
          params: { UserEmail: auth.email }
        });
        if (res.data) {
          const userData = res.data;

          const mappedUser = {
            id: userData.id || userData.Id,
            email: userData.email || userData.Email,
            firstName: userData.firstName || userData.FirstName,
            familyName: userData.familyName || userData.FamilyName,
            birthday: userData.birthday || userData.Birthday,
            phoneNumber: userData.phoneNumber || userData.PhoneNumber,
            groupName: userData.groupName || userData.GroupName,
            groupRole: userData.groupRole || userData.Role || 'Member',
            groupId: userData.groupId || userData.GroupId,
            profileImage: '',
            groupMembers: userData.groupMembers || []
          };

          setUser(mappedUser);
          setFormData({ ...mappedUser, birthday: mappedUser.birthday || '' });

          try {
            const res2 = await apiCall.get(`/User/GetPhotoProfile/${auth.email}`);
            const photoPath = res2.data?.photoPath;
            const firstName = res2.data?.firstName;
            if (photoPath && photoPath !== 'NoPhoto') {
              setUser(prev => ({ ...prev, profileImage: res2.data?.photoPath || '' }));
            }
            if (firstName)
              auth.firstName = firstName;
          } catch (err) {
            console.error("Erro ao buscar photo:", err);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar utilizadores:", err);
        setUser({});
      }
    };

    fetchData();
  }, [auth.email]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    setImageError(null);
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file (JPG, PNG, or GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image size must be less than 5MB');
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
  imageFormData.append('photo', selectedImage); // O nome deve ser 'photo' (veja o backend)

  try {
    const response = await apiCall.post(
      `/User/UploadProfileImage/${user.id}`,
      imageFormData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    const partialPath = response.data?.partialPath;
    if (partialPath) return partialPath;

    setImageError('Image uploaded but no path returned');
    return null;
  } catch (error) {
    console.error('Error to upload image:', error);
    setImageError('Error to upload image');
    return null;
  }
};

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);
    setImageError(null);

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
      const response = await apiCall.put('/User/EditUser', payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.data) {
        setErrorSubmit('Error to update user data');
        return;
      }

      const updatedUser = { ...formData, profileImage: imageUrl };
      setUser(updatedUser);
      setFormData(updatedUser);
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);

      // Atualiza imagem no contexto auth
      if (imageUrl) {
        setAuth((prev) => ({
          ...prev,
          path: `${import.meta.env.VITE_API_BASE_URL}/${imageUrl}?t=${Date.now()}`
        }));
      }

    } catch (error) {
      setErrorSubmit(error?.response?.data?.message || 'Error to save user data');
    }
  };

  const handleCancel = () => {
    const resetFormData = {
      ...user,
      birthday: user.birthday || ''
    };

    setFormData(resetFormData);
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
  };

  const removeGroupMember = (index) => {
    const newMembers = (formData.groupMembers || []).filter((_, i) => i !== index);
    setFormData({ ...formData, groupMembers: newMembers });
  };

  const handleImageClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({ ...formData, profileImage: '' });
  };

  const displayName = `${user?.firstName || ''}`.trim() || 'User';
  const currentGroupMembers = isEditing ? (formData.groupMembers || []) : (user?.groupMembers || []);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5285";
  const currentImageUrl = imagePreview 
    || (user?.profileImage ? `${API_BASE}/${user.profileImage}` : null);


  return (
    
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
          Profile
        </h1>
      {!isEditing ? (
  <button
    onClick={() => setIsEditing(true)}
    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium hover:opacity-90 transition-colors duration-200"
    style={{ backgroundColor: theme.colors.primary.main }}
  >
    <Edit3 className="h-5 w-5 mr-2" />
    Edit Profile
  </button>
) : (
  <div className="flex space-x-3">
    <button
      onClick={handleCancel}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
    >
      <X className="h-5 w-5 mr-2" />
      Cancel
    </button>
    <button
      onClick={handleSave}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium hover:opacity-90 transition-colors duration-200"
      style={{ backgroundColor: theme.colors.success.main }}
    >
      <Save className="h-5 w-5 mr-2" />
      Save Changes
    </button>
  </div>
)}
      </div>

      {errorSubmit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errorSubmit}</p>
        </div>
      )}

      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden"
        style={{ backgroundColor: theme.colors.background.paper }}
      >
        {/* Profile Header */}
        <div className="px-6 py-8 border-b" style={{ borderColor: theme.colors.secondary.light }}>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div 
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}
                style={{ backgroundColor: theme.colors.primary.main }}
                onClick={handleImageClick}
              >
                {currentImageUrl ? (
  <img 
    src={currentImageUrl}
    alt="Profile" 
    className="w-full h-full object-cover"
  />
) : (
  displayName.charAt(0).toUpperCase()
)}
                
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              
              {isEditing && currentImageUrl && (
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
                {displayName}
              </h2>
              <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
                {user?.email || 'No email provided'}
              </p>
              <div className="mt-2">
                <span 
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: theme.colors.primary.light + '30',
                    color: theme.colors.primary.main 
                  }}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  {user?.groupRole || 'Member'}
                </span>
              </div>
              
              {isEditing && (
                <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>
                  Click on your profile picture to change it
                </p>
              )}
              
              {imageError && (
                <p className="text-sm mt-2 text-red-600">{imageError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="px-6 py-8">
          <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
            Personal Information
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* First Name */}
            <div className="flex items-start space-x-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.primary.light + '20' }}
              >
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  First Name
                </h4>
                {!isEditing ? (
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.firstName || 'Not provided'}
                  </p>
                ) : (
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
                    placeholder="Enter first name"
                  />
                )}
              </div>
            </div>

            {/* Family Name */}
            <div className="flex items-start space-x-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.primary.light + '20' }}
              >
                <User className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  Family Name
                </h4>
                {!isEditing ? (
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.familyName || 'Not provided'}
                  </p>
                ) : (
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
                    placeholder="Enter family name"
                  />
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start space-x-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.primary.light + '20' }}
              >
                <Mail className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  Email Address
                </h4>
                <p className="text-base" style={{ color: theme.colors.text.primary }}>
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Birthday */}
            <div className="flex items-start space-x-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.secondary.light + '20' }}
              >
                <Calendar className="h-5 w-5" style={{ color: theme.colors.secondary.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  Birthday
                </h4>
                {!isEditing ? (
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    
                    {user?.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not provided'}
                  </p>
                ) : (
                  <input
                    type="date"
                    value={formData.birthday || ''}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: theme.colors.secondary.light,
                      color: theme.colors.text.primary
                    }}
                  />
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-start space-x-4">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.colors.success.light + '20' }}
              >
                <Phone className="h-5 w-5" style={{ color: theme.colors.success.main }} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                  Phone Number
                </h4>
                {!isEditing ? (
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.phoneNumber || 'Not provided'}
                  </p>
                ) : (
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
                    placeholder="Enter phone number"
                  />
                )}
              </div>
            </div>

            {/* Password */}
            {isEditing && (
              <div className="flex items-start space-x-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.error.light + '20' }}
                >
                  <Lock className="h-5 w-5" style={{ color: theme.colors.error.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    New Password
                  </h4>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    style={{
                      backgroundColor: theme.colors.background.paper,
                      borderColor: theme.colors.secondary.light,
                      color: theme.colors.text.primary
                    }}
                    placeholder="Leave empty to keep current password"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Group Information Section */}
          <div className="mt-8 pt-8 border-t" style={{ borderColor: theme.colors.secondary.light }}>
            <h3 className="text-lg font-semibold mb-6" style={{ color: theme.colors.text.primary }}>
              Group Information
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Group Name */}
              <div className="flex items-start space-x-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.success.light + '20' }}
                >
                  <Shield className="h-5 w-5" style={{ color: theme.colors.success.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Group Name
                  </h4>
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.groupName || 'Member'}
                  </p>
                </div>
              </div>

              {/* Code Invite */}
              <div className="flex items-start space-x-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.primary.light + '20' }}
                >
                  <Key className="h-5 w-5" style={{ color: theme.colors.primary.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Invite Code
                  </h4>
                  <p className="text-base font-mono" style={{ color: theme.colors.text.primary }}>
                    {user?.groupId || 'Not provided'}
                  </p>
                </div>
              </div>

              {/* Group Role */}
              <div className="flex items-start space-x-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.success.light + '20' }}
                >
                  <Shield className="h-5 w-5" style={{ color: theme.colors.success.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
                    Group Role
                  </h4>
                  <p className="text-base" style={{ color: theme.colors.text.primary }}>
                    {user?.groupRole || 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* Group Members */}
            <div className="mt-6">
              <div className="flex items-center space-x-4 mb-4">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: theme.colors.secondary.light + '20' }}
                >
                  <Users className="h-5 w-5" style={{ color: theme.colors.secondary.main }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
                    Group Members ({currentGroupMembers.length})
                  </h4>
                </div>
              </div>
              
              <div className="space-y-2 ml-12">
                {currentGroupMembers.length === 0 ? (
                  <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
                    No group members
                  </p>
                ) : (
                  currentGroupMembers.map((member, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {!isEditing ? (
                        <p className="text-base" style={{ color: theme.colors.text.primary }}>
                          • {member}
                        </p>
                      ) : (
                        <>
                          <button
                            onClick={() => removeGroupMember(index)}
                            className="px-2 py-1 text-sm rounded-md text-white"
                            style={{ backgroundColor: theme.colors.error.main }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;