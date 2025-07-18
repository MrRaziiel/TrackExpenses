import React, { useState, useEffect, useContext } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../../../hooks/apiCall';
import AuthContext from '../../Authentication/AuthContext';
import { useTheme } from '../../Theme/Theme';

function EarningsList() {
  const { auth } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [earnings, setEarnings] = useState([]);

  useEffect(() => {
    const fetchEarnings = async () => {
      const res = await apiCall.get(`Earnings/GetByUser?email=${auth.email}`);
      setEarnings(res.data?.$values || []);
    };
    fetchEarnings();
  }, [auth.email]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this earning?')) {
      await apiCall.delete(`Earnings/Delete/${id}`);
      setEarnings(prev => prev.filter(e => e.id !== id));
    }
  };
  const toggleActive = async (id) => {
  const earning = earnings.find(e => e.id === id);
  if (!earning) return;
  const updated = { ...earning, isActive: !earning.isActive };
  await apiCall.put('Earnings/Update', updated);
  setEarnings((prev) => prev.map(e => e.id === id ? updated : e));
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          Earnings
        </h1>
        <button
          onClick={() => navigate('/Earnings/add')}
          className="flex items-center px-4 py-2 text-white rounded-lg"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          <Plus className="h-5 w-5 mr-2" /> Add
        </button>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-left">Amount</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {earnings.map((e) => (
            <tr key={e.id}>
              <td className="px-6 py-4 text-sm text-center">{new Date(e.date).toLocaleDateString()}</td>
              <td className="px-6 py-4 text-sm text-center">{e.name}</td>
              <td className="px-6 py-4 text-sm text-center">{e.category}</td>
              <td className="px-6 py-4 text-sm text-center  text-green-600">{e.amount.toFixed(2)} €</td>
              <td className="px-6 py-4 text-sm text-center">
  <input
    type="checkbox"
    checked={e.isActive}
    onChange={() => toggleActive(e.id)}
  />
</td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => navigate(`/earnings/edit/${e.id}`)}
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EarningsList;
