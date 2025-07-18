import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import apiCall from '../../../hooks/apiCall';
import AuthContext from '../../Authentication/AuthContext';
import { useTheme } from '../../Theme/Theme';

function AddEditEarning({ isEdit = false, existingData = null }) {
  const { theme } = useTheme();
  const { auth } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
const [formData, setFormData] = useState({
  name: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  category: '',
  periodicity: 'OneTime',
  repeatCount: 1,
  isActive: true  
});

  useEffect(() => {
    if (isEdit && id) {
      apiCall.get(`Earnings/GetById/${id}`).then(res => {
        const data = res.data;
        setFormData({
          ...data,
          amount: data.amount.toString(),
          date: data.date.split('T')[0],
          repeatCount: data.repeatCount?.toString() || '1'
        });
      });
    }
  }, [isEdit, id]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiCall.get('/Categories/GetCategoriesByType?type=Earning');
        setCategories(response?.data?.$values || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      userEmail: auth?.email,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
      repeatCount: parseInt(formData.repeatCount || '1')
    };

    if (isEdit) await apiCall.put('Earnings/Update', payload);
    else await apiCall.post('Earnings/Create', payload);

    navigate('/earnings');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold">{isEdit ? 'Edit Earning' : 'Add Earning'}</h2>

      <div>
        <label>Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full rounded-md border p-2"
        />
      </div>
         <div>
  <label className="inline-flex items-center space-x-2">
    <input
      type="checkbox"
      checked={formData.isActive}
      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
    />
    <span>Active</span>
  </label>
</div>

      <div>
        <label>Amount (€) *</label>
        <input
          type="number"
          required
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label>Date *</label>
        <input
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full rounded-md border p-2"
        />
      </div>

      <div>
        <label>Category</label>
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

      <div>
        <label>Periodicity *</label>
        <select
          value={formData.periodicity}
          onChange={(e) => setFormData({ ...formData, periodicity: e.target.value })}
          className="w-full rounded-md border p-2"
        >
          <option value="OneTime">One Time</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
        </select>
      </div>

      {formData.periodicity !== 'OneTime' && (
        <div>
          <label>Repeat Count *</label>
          <input
            type="number"
            min="1"
            value={formData.repeatCount}
            onChange={(e) => setFormData({ ...formData, repeatCount: e.target.value })}
            className="w-full rounded-md border p-2"
          />
        </div>
      )}
     
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => navigate('/earnings')}
          className="inline-flex items-center px-4 py-2 border rounded-md text-gray-700"
        >
          <X className="h-4 w-4 mr-1" /> Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 text-white rounded-md"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          <Save className="h-4 w-4 mr-1" /> Save
        </button>
      </div>
    </form>
  );
}

export default AddEditEarning;