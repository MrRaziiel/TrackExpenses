// EditInstanceCard.jsx
import React, { useState } from 'react';
import apiCall from '../../../hooks/apiCall';
import { CheckCircle, XCircle } from 'lucide-react';

function EditInstanceCard({ instance }) {
  const [paidValue, setPaidValue] = useState(instance.value || 0);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState(instance.isPaid);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImageFile(file);
  };

  const handleSave = async () => {
    const instValue = parseFloat(instance.value || 0);
    const pay = parseFloat(paidValue);

    if (pay > instValue) {
      alert("O valor pago não pode ser maior que a dívida.");
      return;
    }

    const payload = {
      ...instance,
      isPaid: pay === instValue,
      value: pay,
    };

    try {
      await apiCall.post("/Expenses/UpdateExpenseInstance", payload);
      setStatus(pay === instValue);
      alert("Instância atualizada com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar instância:", err);
    }
  };

  return (
    <div className="border p-4 rounded shadow bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          📅 {new Date(instance.dueDate).toLocaleDateString()}
        </div>
        <div>
          {status ? (
            <CheckCircle className="text-green-600" />
          ) : (
            <XCircle className="text-red-500" />
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Valor Pago</label>
        <input
          type="number"
          value={paidValue}
          onChange={(e) => setPaidValue(e.target.value)}
          step="0.01"
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Imagem (opcional)</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <button
        onClick={handleSave}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Guardar
      </button>
    </div>
  );
}

export default EditInstanceCard;
