import React, { useState } from 'react';
import apiCall from '../../AuthenticationService/hooks/apiCall';
import { CheckCircle, XCircle } from 'lucide-react';

function EditInstanceCard({ instance }) {
  const [paidValue, setPaidValue] = useState(instance.paidAmount || 0);
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
      isPaid: pay >= instValue,
      paidAmount: pay,
    };

    try {
      await apiCall.post("/Expenses/UpdateExpenseInstance", payload);
      setStatus(pay >= instValue);
      alert("Instância atualizada com sucesso");
    } catch (err) {
      console.error("Erro ao atualizar instância:", err);
    }
  };

  const restante = Math.max(0, instance.value - paidValue).toFixed(2);

  return (
    <div className="border p-4 rounded shadow bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          📅 {new Date(instance.dueDate).toLocaleDateString()}
        </div>
        <div>
          {status ? (
            <div className="flex items-center text-green-600 font-medium">
              <CheckCircle className="w-5 h-5 mr-1" />
              Pago
            </div>
          ) : (
            <div className="flex items-center text-red-500 font-medium">
              <XCircle className="w-5 h-5 mr-1" />
              Em aberto
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Valor da Instância</label>
          <input
            type="number"
            value={instance.value}
            readOnly
            className="w-full border rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed"
          />
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
      </div>

      <div>
        <p className={`text-sm font-medium ${restante <= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
          {restante <= 0
            ? 'Pagamento completo'
            : `Falta pagar: € ${restante}`}
        </p>
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
