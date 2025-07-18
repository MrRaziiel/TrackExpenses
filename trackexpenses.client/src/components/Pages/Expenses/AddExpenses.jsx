import React, { useState, useContext, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../Theme/Theme';
import AuthContext from '../../Authentication/AuthContext';
import apiCall from '../../../hooks/apiCall';

function AddExpense() {
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    payAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    periodicity: 'OneTime',
    endDate: '',
    repeatCount: '1',
    shouldNotify: true,
    category: ''
  });

  const [endDateTouched, setEndDateTouched] = useState(false);
  const isRecurring = formData.periodicity !== 'OneTime';

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiCall.get('/Categories/GetCategoriesByType?type=Expense');
        setCategories(response?.data?.$values || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const getMinEndDate = () => {
    const count = parseInt(formData.repeatCount || '1');
    const start = new Date(formData.startDate);
    const minEnd = new Date(start);

    switch (formData.periodicity) {
      case 'Daily': minEnd.setDate(start.getDate() + count - 1); break;
      case 'Weekly': minEnd.setDate(start.getDate() + 7 * (count - 1)); break;
      case 'Monthly': minEnd.setMonth(start.getMonth() + (count - 1)); break;
      case 'Yearly': minEnd.setFullYear(start.getFullYear() + (count - 1)); break;
      default: return formData.startDate;
    }
    return minEnd.toISOString().split('T')[0];
  };

  useEffect(() => {
    if (!formData.startDate || !formData.periodicity || endDateTouched) return;
    const count = parseInt(formData.repeatCount || '1');
    if (isNaN(count) || count < 1) return;

    const start = new Date(formData.startDate);
    const newEnd = new Date(start);
    switch (formData.periodicity) {
      case 'Daily': newEnd.setDate(start.getDate() + count - 1); break;
      case 'Weekly': newEnd.setDate(start.getDate() + 7 * (count - 1)); break;
      case 'Monthly': newEnd.setMonth(start.getMonth() + (count - 1)); break;
      case 'Yearly': newEnd.setFullYear(start.getFullYear() + (count - 1)); break;
    }
    const formatted = newEnd.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, endDate: formatted }));
  }, [formData.startDate, formData.periodicity, formData.repeatCount, endDateTouched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      value: parseFloat(formData.value),
      payAmount: formData.payAmount ? parseFloat(formData.payAmount) : 0,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      repeatCount: formData.repeatCount ? parseInt(formData.repeatCount) : null,
      userEmail: auth?.email || ''
    };

    try {
      await apiCall.post('Expenses/CreateExpenses', payload);
      navigate('/expenses');
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const amountPerRepeat = () => {
    const value = parseFloat(formData.value || 0);
    const pay = parseFloat(formData.payAmount || 0);
    const count = parseInt(formData.repeatCount || 1);
    if (!count || count === 0) return null;
    const result = (value - pay) / count;
    return isNaN(result) ? null : result.toFixed(2);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          New Expense with Reminder
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Category *</label>
          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">Value (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Paid Amount (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.payAmount}
              onChange={(e) => setFormData({ ...formData, payAmount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium">Start Date *</label>
    <input
      type="date"
      required
      value={formData.startDate}
      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    />
  </div>
  <div>
    <label className="block text-sm font-medium">Periodicity *</label>
    <select
      required
      value={formData.periodicity}
      onChange={(e) => {
        setFormData({ ...formData, periodicity: e.target.value });
        setEndDateTouched(false);
      }}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
    >
      <option value="OneTime">One Time</option>
      <option value="Daily">Daily</option>
      <option value="Weekly">Weekly</option>
      <option value="Monthly">Monthly</option>
      <option value="Yearly">Yearly</option>
    </select>
  </div>
</div>

        {isRecurring && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                min={getMinEndDate()}
                onChange={(e) => {
                  const selected = new Date(e.target.value);
                  const minEndDate = new Date(getMinEndDate());
                  if (selected >= minEndDate) {
                    setFormData({ ...formData, endDate: e.target.value });
                    setEndDateTouched(true);
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Repeat Count</label>
              <input
                type="number"
                min="1"
                value={formData.repeatCount}
                onChange={(e) => {
                  setFormData({ ...formData, repeatCount: e.target.value });
                  setEndDateTouched(false);
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                placeholder="e.g., 12 times"
              />
            </div>
          </div>
        )}

        {isRecurring && amountPerRepeat() && (
          <div>
            <div className="text-sm text-gray-600 mt-2">
                Approx. Amount per Payment: <strong>{amountPerRepeat()} €</strong>
              </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.shouldNotify}
            onChange={(e) => setFormData({ ...formData, shouldNotify: e.target.checked })}
          />
          <label className="text-sm">Enable notification</label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/expenses')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-5 w-5 mr-2" /> Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-white"
            style={{ backgroundColor: theme?.colors?.primary?.main }}
          >
            <Save className="h-5 w-5 mr-2" /> Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddExpense;
