import React, { useState, useEffect, useContext } from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';
import apiCall from '../../../hooks/apiCall';
import AuthContext from '../../Authentication/AuthContext';
import {  useNavigate } from 'react-router-dom';

const arrayPropertiesToShow = ["firstName", "familyName", "email", "birthday"];

function UsersList() {
  const { auth, isAuthenticated, role } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorSubmit, setErrorSubmit] = useState(null);
  const navigate = useNavigate();
  // Buscar utilizadores ao montar
  useEffect(() => {
    const fetchData = async () => {
      setErrorSubmit(null);
      try {
        const res = await apiCall.get('Administrator/User/GetAllUsers');
        if (res.data) {
          setUsers(res.data.$values);
        }
      } catch (err) {
        console.error("Erro ao buscar utilizadores:", err);
        setUsers([]);
      }
    };

    fetchData();
  }, []);

  // Actualizar lista filtrada sempre que users ou searchTerm mudar
  useEffect(() => {
    const result = users.filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(result);
  }, [users, searchTerm]);

  const handleEdit = (userId) => {
    console.log('Editar utilizador:', userId);
    navigate("edit/:  ", userId);
  }

  const handleDelete = async (userId) => {
    if (!isAuthenticated || role !== "ADMINISTRATOR") return;

    const confirmDelete = window.confirm('Tens a certeza que queres apagar este utilizador?');
    if (!confirmDelete) return;

    try {
      const response = await apiCall.post('Administrator/User/DeleteUser', userId);
      if (!response || response.status !== 200) {
        setErrorSubmit('Erro ao apagar utilizador.');
        return;
      }

      // Remove utilizador da lista original (o useEffect trata da filtrada)
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));

    } catch (err) {
      console.error("Erro ao apagar utilizador:", err);
      setErrorSubmit(err.message || 'Ocorreu um erro.');
    }
  };

  const renderContent = () => {
    if (!filteredUsers.length) {
      return (
        <tr className="hover:bg-gray-50">
          <td
            colSpan={100}
            className="px-6 py-8 text-center"
            style={{ color: theme?.colors?.text?.secondary }}
          >
            {t('common.noUsersFound')}
          </td>
        </tr>
      );
    }

    return filteredUsers.map((user, index) => (
      <tr key={index}>
        {arrayPropertiesToShow.map((prop) => (
          <td
            key={prop}
            className="px-6 py-4 whitespace-nowrap text-center"
            style={{ color: theme?.colors?.text?.secondary }}
          >
            {user[prop] || "-"}
          </td>
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
    ));
  };

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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50" style={{ backgroundColor: theme?.colors?.background?.paper }}>
              <tr>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.firstName')}
                </th>
                 <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.familyName')}
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.email')}
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.date')}
                </th>
                <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200" style={{ backgroundColor: theme?.colors?.background?.paper }}>
              {renderContent()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UsersList;
