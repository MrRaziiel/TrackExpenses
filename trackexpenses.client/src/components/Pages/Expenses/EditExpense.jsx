import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiCall from '../../../hooks/apiCall';
import EditInstanceCard from './EditInstanceCard';

function EditExpense() {
  const { id } = useParams();
  const [expense, setExpense] = useState(null);

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
      } catch (err) {
        console.error('Erro ao carregar a despesa:', err);
      }
    };

    fetchExpense();
  }, [id]);

  if (!expense) return <p>Carregando...</p>;

  const isOneTime = expense.periodicity === 'OneTime';

  const handleInstanceChange = (updatedInstance) => {
    setExpense((prev) => ({
      ...prev,
      instances: prev.instances.map((inst) =>
        inst.id === updatedInstance.id ? updatedInstance : inst
      ),
    }));
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Editar Despesa</h1>

      <div className="bg-white p-4 rounded shadow space-y-4">
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

        {!isOneTime && (
          <div>
            <label className="block text-sm font-medium">Imagem</label>
            <input type="file" accept="image/*" />
          </div>
        )}
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
    </div>
  );
}

export default EditExpense;