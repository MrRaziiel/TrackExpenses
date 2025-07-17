import React, { useState, useEffect, useContext } from 'react';
import { Plus, Search, Filter, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';
import AuthContext from '../../Authentication/AuthContext';
import apiCall from '../../../hooks/apiCall';

function Expenses() {
  const theme = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await apiCall.get(`Expenses/ListExpenses?userEmail=${auth?.email}`);
        setExpenses(response?.data?.$values || []);
      } catch (error) {
        console.error('Failed to fetch expenses:', error);
      }
    };
    fetchExpenses();
  }, [auth?.email]);

  const filteredExpenses = expenses.filter(exp =>
    exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (id) => {
    navigate(`/expenses/edit/${id}`);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this expense?');
    if (!confirm) return;

    try {
      await apiCall.post('Expenses/DeleteExpense', { id });
      setExpenses(prev => prev.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.expenses')}
        </h1>
        <button
          onClick={() => navigate('/expenses/add')}
          className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-blue-600 transition-colors"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('common.add')} {t('common.expense')}
        </button>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t('common.searchExpenses')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="h-5 w-5 mr-2" />
          {t('common.filter')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.date')}
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.name')}
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.category')}
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.amount')}
              </th>
              <th className="px-6 py-3 text-xs font-medium uppercase tracking-wider text-center" style={{ color: theme?.colors?.text?.secondary }}>
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  {t('common.noExpenses')}
                </td>
              </tr>
            ) : (
              filteredExpenses.map(exp => (
                <tr key={exp.id}>
                  <td className="px-6 py-4 text-sm text-center">{new Date(exp.startDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-center">{exp.name}</td>
                  <td className="px-6 py-4 text-sm text-center">{exp.category}</td>
                  <td className="px-6 py-4 text-sm text-center text-red-600">-{exp.value.toFixed(2)}€</td>
                  <td className="px-6 py-4 text-sm text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button
                        onClick={() => handleEdit(exp.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Expenses;