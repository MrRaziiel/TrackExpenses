import React, { useContext, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AuthContext from '../../services/Authentication/AuthContext';
import { useTheme } from '../../styles/Theme/Theme';
import apiCall from '../../services/ApiCalls/apiCall';
import { Save, X, User, Mail, Calendar, Phone, Lock, Shield, Key, Camera, Users, Eye, EyeOff } from 'lucide-react';

function EditUserProfile() {
  const { id, email } = useParams();
  const decodedEmail = decodeURIComponent(email || '');
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [errorSubmit, setErrorSubmit] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const fileInputRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall.get('/User/GetProfile', {
          params: { UserEmail: decodedEmail }
        });

        if (!res.data) {
          navigate('/users');
          return;
        }

        // ✅ Normaliza os campos
        const userData = res.data;

        const mappedUser = {
          id: userData.Id || userData.id,
          email: userData.Email || userData.email,
          firstName: userData.FirstName || userData.firstName,
          familyName: userData.FamilyName || userData.familyName,
          birthday: userData.Birthday || userData.birthday,
          phoneNumber: userData.PhoneNumber || userData.phoneNumber,
          groupName: userData.GroupName || '',
          groupRole: userData.GroupRole || userData.Role || 'Member',
          groupId: userData.GroupId || '',
          profileImage: '',
          groupMembers: userData.GroupMembers || []
        };

        setUser(mappedUser);
        setFormData({ ...mappedUser, birthday: mappedUser.birthday || '' });
        setCurrentGroupMembers(mappedUser.groupMembers || []);

        // imagem
        const res2 = await apiCall.get(`/User/GetPhotoProfile/${decodedEmail}`);
        const photoPath = res2.data?.photoPath;
        if (photoPath && photoPath !== 'NoPhoto') {
          setUser(prev => ({ ...prev, profileImage: photoPath }));
        }

      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
        navigate('/users');
      }
    };

    if (decodedEmail && id) fetchData();
  }, [decodedEmail, id, navigate]);

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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setUser(prev => ({ ...prev, profileImage: null }));
  };

  const uploadImage = async () => {
    if (!selectedImage) return null;

    const imageFormData = new FormData();
    imageFormData.append('Photo', selectedImage);

    try {
      const response = await apiCall.post(`/User/UploadProfileImage/${id}`, imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

    let imageUrl = user?.profileImage;

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

      const updated = { ...formData, profileImage: imageUrl };
      setUser(updated);
      setFormData(updated);
      setSelectedImage(null);
      setImagePreview(null);
      navigate('/users');
    } catch (error) {
      setErrorSubmit(error?.response?.data?.message || 'Erro ao guardar');
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  const removeGroupMember = (index) => {
    const updated = [...currentGroupMembers];
    updated.splice(index, 1);
    setCurrentGroupMembers(updated);
  };

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5285";
  const currentImageUrl = imagePreview || (user?.profileImage ? `${API_BASE}/${user.profileImage}?t=${Date.now()}` : null);
  const displayName = `${user?.firstName || ''}`.trim() || 'User';

  if (!user) return null;

  return (
    
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
          Profile
        </h1>

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
                className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden ${ 'cursor-pointer' }`}
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
                
               
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200 rounded-full">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                
              </div>
              
              {currentImageUrl && (
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
              
              
                <p className="text-sm mt-2" style={{ color: theme.colors.text.secondary }}>
                  Click on your profile picture to change it
                </p>
             
              
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
                  />
             
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
           
              </div>
            </div>

            {/* Password */}
     
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
            placeholder="Leave empty to keep current password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2"
            style={{
              color: theme.colors.text.secondary,
              transition: 'color 0.2s ease',
              cursor: 'pointer'
            }}
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 hover:opacity-80" />
            ) : (
              <Eye className="h-5 w-5 hover:opacity-80" />
            )}
          </button>
        </div>
      </div>
    </div>
          
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

                        <>
                          <button
                            onClick={() => removeGroupMember(index)}
                            className="px-2 py-1 text-sm rounded-md text-white"
                            style={{ backgroundColor: theme.colors.error.main }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                  
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

export default EditUserProfile;
