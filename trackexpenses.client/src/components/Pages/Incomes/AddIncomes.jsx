import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useTheme } from '../../Theme/Theme';


function AddIncome() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    category: 'Salary',
    amount: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Save income:', formData);
    navigate('/incomes');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>Add Income</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="date" className="block text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              Date
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              Source
            </label>
            <input
              type="text"
              id="source"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter income source"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Investments">Investments</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium" style={{ color: theme.colors.text.secondary }}>
              Amount
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-7 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/incomes')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white"
              style={{ backgroundColor: theme.colors.primary.main }}
            >
              <Save className="h-5 w-5 mr-2" />
              Save Income
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddIncome;