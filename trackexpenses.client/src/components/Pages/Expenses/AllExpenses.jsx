import React, { useState, useEffect, useContext } from 'react';
import {
  Plus, Search, Filter, Pencil, Trash2,
  ChevronDown, ChevronUp, CheckCircle, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';
import AuthContext from '../../Authentication/AuthContext';
import apiCall from '../../../hooks/apiCall';

function ListExpenses() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await apiCall.get(`Expenses/ListExpenses?userEmail=${auth?.email}`);
        const enriched = res?.data?.$values?.map(e => ({
          ...e,
          id: e.Id,
          name: e.Name,
          category: e.Category,
          startDate: e.StartDate,
          value: e.Value,
          instances: {
            $values: e.Instances?.$values?.map(i => ({
              id: i.Id,
              dueDate: i.DueDate,
              isPaid: i.IsPaid,
              value: i.Value
            })) || []
          },
          sortAsc: true
        })) || [];
        setExpenses(enriched);
      } catch (err) {
        console.error('Erro ao carregar despesas', err);
      }
    };
    fetchExpenses();
  }, [auth?.email]);

  const filtered = expenses.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditExpense = (expenseId) => {
    navigate(`/expenses/edit/${expenseId}`);
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Deseja apagar esta despesa e todas as instâncias?')) return;

    try {
      await apiCall.post('Expenses/DeleteExpense', { id: expenseId });
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    } catch (err) {
      console.error('Erro ao apagar despesa', err);
    }
  };

  const handleEditInstance = (instanceId) => {
    navigate(`/expenses/instance/edit/${instanceId}`);
  };

  const handleDeleteInstance = async (instanceId) => {
    if (!window.confirm('Deseja apagar esta instância?')) return;

    try {
      await apiCall.post('Expenses/DeleteExpenseInstance', { id: instanceId });
      setExpenses(prev =>
        prev.map(exp => ({
          ...exp,
          instances: {
            $values: exp.instances?.$values?.filter(i => i.id !== instanceId) || [],
          },
        }))
      );
    } catch (err) {
      console.error('Erro ao apagar instância', err);
    }
  };

  const toggleExpand = (expenseId) => {
    setExpanded(prev => (prev === expenseId ? null : expenseId));
  };

  const toggleSort = (expenseId) => {
    setExpenses(prev =>
      prev.map(exp =>
        exp.id === expenseId ? { ...exp, sortAsc: !exp.sortAsc } : exp
      )
    );
  };

  const calculateRemaining = (expense) => {
    const total = expense.value || 0;
    const paidSum = expense.instances?.$values
      ?.filter(i => i.isPaid)
      .reduce((sum, i) => sum + (i.value || 0), 0) || 0;
    return (total - paidSum).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.expenses')}
        </h1>
        <button
          onClick={() => navigate('/expenses/add')}
          className="inline-flex items-center px-4 py-2 rounded-lg text-white"
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
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
              <th className="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider">{t('common.name')}</th>
              <th className="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider">{t('common.category')}</th>
              <th className="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider">{t('common.date')}</th>
              <th className="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider">{t('common.value')}/{t('common.notpayed')}</th>
              <th className="px-6 py-3 text-xs font-medium text-left uppercase tracking-wider">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Nenhuma despesa encontrada.
                </td>
              </tr>
            ) : (
              filtered.map(exp => (
                <React.Fragment key={exp.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm flex items-center space-x-2">
                      <button onClick={() => toggleExpand(exp.id)}>
                        {expanded === exp.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <span>{exp.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">{exp.category}</td>
                    <td className="px-6 py-4 text-sm">
                      {exp.startDate ? new Date(exp.startDate).toLocaleDateString() : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      -{calculateRemaining(exp)}€ / {Number(exp.value || 0).toFixed(2)}€
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button onClick={() => handleEditExpense(exp.id)} className="text-blue-600 hover:text-blue-900">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>

                  {expanded === exp.id && exp.instances?.$values?.length > 0 && (
                    <tr>
                      <td colSpan="5" className="bg-gray-50 px-6 pb-4">
                        <div className="flex justify-end mb-2">
                          <button
                            onClick={() => toggleSort(exp.id)}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Ordenar por data {exp.sortAsc ? '⬆️' : '⬇️'}
                          </button>
                        </div>

                        <ul className="space-y-2">
                          {[...exp.instances.$values]
                            .sort((a, b) =>
                              exp.sortAsc
                                ? new Date(a.dueDate) - new Date(b.dueDate)
                                : new Date(b.dueDate) - new Date(a.dueDate)
                            )
                            .map((inst, index) => (
                              <li
                                key={inst.id || index}
                                className="flex justify-between items-center p-2 border rounded bg-white shadow-sm"
                              >
                                <div className="text-sm flex items-center space-x-2">
                                  📅 {inst.dueDate ? new Date(inst.dueDate).toLocaleDateString() : 'Data inválida'}
                                  <span className="text-red-600">
                                    - {Number(inst.value || 0).toFixed(2)}€
                                  </span>
                                  {inst.isPaid ? (
                                    <CheckCircle className="text-green-500" size={16} />
                                  ) : (
                                    <XCircle className="text-red-500" size={16} />
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditInstance(inst.id)}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInstance(inst.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListExpenses;
