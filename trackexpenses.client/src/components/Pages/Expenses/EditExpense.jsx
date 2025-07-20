// EditExpense.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiCall from '../../../hooks/apiCall';
import EditInstanceCard from './EditInstanceCard';
import { Eye, Download, Camera, X, Save } from 'lucide-react';

function EditExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5285';

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        if (!id) return;
        const res = await apiCall.get(`/Expenses/GetExpenseById/${id}`);
        const data = res.data;

        const transformed = {
          id: data.Id,
          name: data.Name,
          category: data.Category,
          description: data.Description,
          value: data.Value,
          payAmount: data.PayAmount,
          startDate: data.StartDate,
          endDate: data.EndDate,
          periodicity: data.Periodicity,
          repeatCount: data.RepeatCount,
          shouldNotify: data.ShouldNotify,
          groupId: data.GroupId,
          imageId: data.ImageId,
          userId: data.UserId,
          instances: data.Instances?.$values?.map((inst) => ({
            id: inst.Id,
            dueDate: inst.DueDate,
            isPaid: inst.IsPaid,
            value: inst.Value,
            paidAmount: inst.PaidAmount,
            imageId: inst.ImageId,
          })) || [],
        };

        setExpense(transformed);

        const imgRes = await apiCall.get(`/Expenses/GetExpenseImage/${id}`);
        const path = imgRes?.data?.imagePath;
        if (path && path !== 'NoPhoto') {
          setImageUrl(`${API_BASE}/${path}`);
        }
      } catch (err) {
        console.error('Erro ao carregar a despesa:', err);
      }
    };

    fetchExpense();
  }, [id]);

  const handleInstanceChange = (updatedInstance) => {
    setExpense((prev) => ({
      ...prev,
      instances: prev.instances.map((inst) =>
        inst.id === updatedInstance.id ? updatedInstance : inst
      ),
    }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);

    setSelectedImage(file);
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    const formData = new FormData();
    formData.append('Image', selectedImage);
    try {
      console.log(formData);
      await apiCall.post(`/Expenses/UploadImage/${id}`, formData);
    } catch (err) {
      console.error('Erro ao carregar imagem:', err);
    }
  };

  const handleSave = async () => {
    try {
      if (selectedImage) await handleUpload();
      console.log('expense', expense);
      await apiCall.put(`/Expenses/UpdateExpense`, expense);
      navigate('/expenses');
    } catch (err) {
      console.error('Erro ao guardar alterações:', err);
    }
  };

  if (!expense) return <p>Carregando...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Editar Despesa</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/expenses')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <X className="h-5 w-5 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-white font-medium bg-green-600 hover:bg-green-700"
          >
            <Save className="h-5 w-5 mr-2" />
            Guardar alterações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Nome</label>
            <input
              type="text"
              value={expense.name}
              onChange={(e) => setExpense({ ...expense, name: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Categoria</label>
            <input
              type="text"
              value={expense.category}
              onChange={(e) => setExpense({ ...expense, category: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Valor Total</label>
            <input
              type="number"
              value={expense.value}
              onChange={(e) => setExpense({ ...expense, value: parseFloat(e.target.value) })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Valor Pago</label>
            <input
              type="number"
              value={expense.payAmount}
              onChange={(e) => setExpense({ ...expense, payAmount: parseFloat(e.target.value) })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Periodicidade</label>
            <input
              type="text"
              value={expense.periodicity}
              readOnly
              className="w-full border p-2 rounded bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data de Início</label>
            <input
              type="date"
              value={expense.startDate?.substring(0, 10)}
              onChange={(e) => setExpense({ ...expense, startDate: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Data de Fim</label>
            <input
              type="date"
              value={expense.endDate?.substring(0, 10) || ''}
              onChange={(e) => setExpense({ ...expense, endDate: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-4">
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt="Despesa"
                className="w-48 h-48 object-contain border rounded shadow"
              />
              <button
                onClick={() => setShowPreview(true)}
                className="absolute top-1 right-1 bg-white p-1 rounded-full shadow"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-gray-500">Sem imagem</p>
          )}

          <div className="flex space-x-3">
            <button
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4" />
              <span>Trocar</span>
            </button>

            {imageUrl && (
              <a
                href={imageUrl}
                download
                className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageSelect}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Instâncias</h2>
        {expense.instances.map((instance) => (
          <EditInstanceCard
            key={instance.id}
            instance={instance}
            totalValue={instance.value}
            onChange={handleInstanceChange}
          />
        ))}
      </div>

      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="relative">
            <img src={imageUrl} alt="Preview" className="max-h-[90vh] max-w-[90vw]" />
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditExpense;