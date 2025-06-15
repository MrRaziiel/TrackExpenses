import React from 'react';
import AuthContext from '../Authentication/AuthContext';
import { useTheme } from '../Theme/Theme';
import { useState, useContext, useEffect } from "react";
import apiCall from '../../hooks/apiCall';
import { Edit3, Save, X, User, Mail, Calendar, Phone, Lock, Users, Shield, Key } from 'lucide-react';

function ProfilePage() {
const [user, setUser] = useState([]);
  const { auth, isAuthenticated, role } = useContext(AuthContext);
  const { theme } = useTheme();
const [errorSubmit, setErrorSubmit] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ });

  useEffect(() => {
  if (user) {
    const defaultFormData = Object.fromEntries(
      Object.entries(user).map(([key, value]) => [key, value || ''])
    );
    setFormData(defaultFormData);
  }
}, [user]);


   useEffect(() => {
    const fetchData = async () => {
      setErrorSubmit(null);
      try {
        const res = await apiCall.get('/User/GetProfile', {params: { UserEmail: auth.email }})
        console.log(res.data);
        if (res.data) {
          setUser(res.data);
        }
      } catch (err) {
        console.error("Erro ao buscar utilizadores:", err);
        setUser([]);
      }
    };

    fetchData();
  }, []);

  const handleSave = async (e) => {
  e.preventDefault();
  setErrorSubmit(null);

  const payload = {
    ...formData,
     birthday: formData.birthday || undefined,
  };

  try {
    console.log("payload",payload.email);
    const response = await apiCall.put('/User/EditUser', payload, {
  headers: {
    'Content-Type': 'application/json'
  }
});
    if (!response.data) {
      setErrorSubmit('Erro ao atualizar os dados do usuário');
      return;
    }

    // Sucesso: faça algo como notificar ou atualizar o estado
    console.log("Usuário atualizado com sucesso:", response.data);
  } catch (error) {
    setErrorSubmit(error?.response?.data?.message || 'Erro ao salvar os dados do usuário');
  }
  const updatedUser = { ...formData }; 
  setUser(updatedUser);
  const resetFormData = Object.fromEntries(
  Object.entries(updatedUser).map(([key, value]) => {
    if (Array.isArray(value)) return [key, [...value]];
    if (typeof value === 'object' && value !== null) return [key, { ...value }];
    return [key, value ?? ''];
    })
    );
    setFormData(resetFormData);
    setIsEditing(false); 
};

const handleCancel = () => {
  if (!user) {
    setFormData({});
    return;
  }

  const resetFormData = Object.fromEntries(
    Object.entries(user).map(([key, value]) => {
      if (Array.isArray(value)) return [key, [...value]]; // clone arrays
      if (typeof value === 'object' && value !== null) return [key, { ...value }]; // shallow clone objects
      return [key, value ?? ''];
    })
  );

  setFormData(resetFormData);
  setIsEditing(false); // exit editing mode
};


  const removeGroupMember = (index) => {
    const newMembers = formData.groupMembers.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      groupMembers: newMembers
    });
  };

  const displayName = `${user?.firstName || ''} ${user?.familyName || ''}`.trim() || 'User';
const currentGroupMembers = isEditing ? (formData.groupMembers || []) : (user?.groupMembers || []);
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

      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden"
        style={{ backgroundColor: theme.colors.background.paper }}
      >
        {/* Profile Header */}
        <div className="px-6 py-8 border-b" style={{ borderColor: theme.colors.secondary.light }}>
          <div className="flex items-center space-x-6">
            <div 
              className="h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg"
              style={{ backgroundColor: theme.colors.primary.main }}
            >
              {displayName.charAt(0).toUpperCase()}
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
                    value={formData.firstName}
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
                    value={formData.familyName}
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
                    {user?.birthDay ? new Date(user.birthDay).toLocaleDateString() : 'Not provided'}
                  </p>
                ) : (
                  <input
                    type="date"
                    value={formData.birthday}
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
                    value={formData.phoneNumber}
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
                    value={formData.password}
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
                  {!isEditing ? (
                    <p className="text-base font-mono" style={{ color: theme.colors.text.primary }}>
                      {user?.codeInvite || 'Not provided'}
                    </p>
                  ) : (
                    <input
                      type="text"
                      value={formData.codeInvite}
                      onChange={(e) => setFormData({ ...formData, codeInvite: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      style={{
                        backgroundColor: theme.colors.background.paper,
                        borderColor: theme.colors.secondary.light,
                        color: theme.colors.text.primary
                      }}
                      placeholder="Enter invite code"
                    />
                  )}
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
                  {!isEditing ? (
                    <p className="text-base" style={{ color: theme.colors.text.primary }}>
                      {user?.groupRole || 'Member'}
                    </p>
                  ) : (
                    <select
                      value={formData.groupRole}
                      onChange={(e) => setFormData({ ...formData, groupRole: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      style={{
                        backgroundColor: theme.colors.background.paper,
                        borderColor: theme.colors.secondary.light,
                        color: theme.colors.text.primary
                      }}
                    >
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                  )}
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
                  <p className="text-sm\" style={{ color: theme.colors.text.secondary }}>
                    No group members
                  </p>
                ) : (
                  currentGroupMembers.map((member, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {!isEditing ? (
                        <p className="text-base\" style={{ color: theme.colors.text.primary }}>
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

export default ProfilePage