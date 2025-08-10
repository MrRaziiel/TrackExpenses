import React, { useState, useEffect, useContext } from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';
import apiCall from '../../../hooks/apiCall';
import AuthContext from '../../Authentication/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../../../services/UsersServices';

const arrayPropertiesToShow = ["fullName", "email", "birthday", "role", "group"];

function UsersList() {
  const { auth, isAuthenticated, role } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorSubmit, setErrorSubmit] = useState(null);
  const navigate = useNavigate();

  

  useEffect(() => {
    const fetchData = async () => {
      setErrorSubmit(null);

      const usersList = await getAllUsers();
      if (!usersList) setErrorSubmit("Error searching Users");
      setUsers(usersList);

    };
    fetchData();
  }, []);

  useEffect(() => {
    const result = users.filter(user =>
      (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(result);
  }, [users, searchTerm]);

  const handleEdit = (email, id) => {
    navigate(`/users/edit/${id}/${email}`);
  };

  const handleDelete = async (userId) => {
    if (!isAuthenticated || role !== "ADMINISTRATOR") return;

    const confirmDelete = window.confirm('Tens a certeza que queres apagar este utilizador?');
    if (!confirmDelete) return;

    try {
      const response = await apiCall.post('Administrator/User/DeleteUser', userId);
      if (response?.status === 200) {
        setUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        setErrorSubmit('Erro ao apagar utilizador.');
      }
    } catch (err) {
      setErrorSubmit(err.message || 'Ocorreu um erro.');
    }
  };

  const renderContent = () => {
    if (!filteredUsers.length) {
      return (
        <tr>
          <td colSpan={100} className="px-6 py-8 text-center" style={{ color: theme?.colors?.text?.secondary }}>
            
            {errorSubmit && (
        <div className="text-red-600 text-center">
          {errorSubmit}
        </div>
      )|| t('common.noUsersFound')}
          </td>
        </tr>
      );
    }

    return filteredUsers.map((user, index) => (
      <tr key={index}>
        {arrayPropertiesToShow.map((prop) => {
          let value;
          switch (prop) {
            case "fullName":
              value = `${user.firstName || ""} ${user.familyName || ""}`.trim();
              break;
            case "group":
              value = user.groupOfUsers?.name || "-";
              break;
            case "birthday":
              value = user.birthday ? new Date(user.birthday).toLocaleDateString() : "-";
              break;
            default:
              value = user[prop] || "-";
          }

          return (
            <td
              key={prop}
              className="px-4 py-3 text-sm text-center break-words max-w-[200px]"
              style={{ color: theme?.colors?.text?.secondary }}
            >
              {value}
            </td>
          );
        })}
        <td className="px-4 py-3 text-sm text-center">
          <div className="flex justify-center items-center space-x-2">
            <button
              onClick={() => handleEdit(user.email, user.id)}
              className="text-blue-600 hover:text-blue-900"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(user.id)}
              className="text-red-600 hover:text-red-900"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.users')}
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
            style={{
              backgroundColor: theme?.colors?.background?.paper,
              color: theme?.colors?.text?.primary,
              borderColor: theme?.colors?.secondary?.light
            }}
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-auto" style={{ backgroundColor: theme?.colors?.background?.paper }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead style={{ backgroundColor: theme?.colors?.background?.paper }}>
            <tr>
              {arrayPropertiesToShow.map((key, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center"
                  style={{ color: theme?.colors?.text?.secondary }}
                >
                  {t(`common.${key}`)}
                </th>
              ))}
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody style={{ backgroundColor: theme?.colors?.background?.paper }}>
            {renderContent()}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default UsersList;
