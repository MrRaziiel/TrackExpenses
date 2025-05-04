import React from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../Translate/LanguageContext';

function Incomes() {
  const theme = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.incomes')}
        </h1>
        <button 
          onClick={() => navigate('/incomes/add')}
          className="flex items-center px-4 py-2 text-white rounded-lg hover:bg-blue-600 transition-colors"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          <Plus className="h-5 w-5 mr-2" />
          {t('common.add')} {t('common.income')}
        </button>
      </div>

      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder={t('common.searchIncomes')}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.source')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.category')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('common.amount')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                2024-03-15
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {t('categories.salary')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {t('categories.salary')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                +$3,000.00
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Incomes;