import React, { useState, useEffect } from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../Translate/LanguageContext';
import { getUsers } from "../../../services/UserService";

const arrayPropertiesToShow = ["name", "email", "birthday"];

function UsersList() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);

  // Buscar clientes ao carregar o componente
  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getUsers();
      setUsers(data);
    };
    fetchUsers();
  }, []);


  const [searchTerm, setSearchTerm] = useState('');

  const handleEdit = (userId) => {
    console.log('Edit user:', userId);
  };

  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      console.log('Delete user:', userId);
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );



function renderContent(filteredUsers)
{
  
  if (!Array.isArray(filteredUsers) || filteredUsers.length == 0)
  {
    return(
      <tr className="hover:bg-gray-50">
  <td
    colSpan={100}
    className="px-6 py-8 text-center"
    style={{ color: theme?.colors?.text?.secondary }}
  >
    NO USERS FOUND
  </td>
</tr>
    )
  }
  return(

    filteredUsers.map((user, index) => (
      <tr key={index}>
        {arrayPropertiesToShow.map((prop) => (

            <td key={prop} className="px-6 py-4 whitespace-nowrap text-center" style={{ color: theme?.colors?.text?.secondary }}>{user[prop]}</td>
 
        ))}
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handleEdit(user.id)}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </td>
      </tr>
    )))
        
}


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.users')}
        </h1>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          style={{
            backgroundColor: theme?.colors?.background?.paper,
            color: theme?.colors?.text?.primary,
            borderColor: theme?.colors?.secondary?.light
          }}
        />
        <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" >
            <thead className="bg-gray-50" style={{ backgroundColor: theme?.colors?.background?.paper }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.name')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody suppressHydrationWarning className="divide-y divide-gray-200" style={{ backgroundColor: theme?.colors?.background?.paper }}>
              {renderContent(filteredUsers)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersList;