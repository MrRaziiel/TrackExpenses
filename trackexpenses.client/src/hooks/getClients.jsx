// src/hooks/useClients.js
import { useState, useEffect } from 'react';
import { getClients } from '../services/ClientService';

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Inicia a busca dos clientes
    setLoading(true);
    getClients()
      .then((data) => {
        setClients(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao buscar clientes');
      })
      .finally(() => setLoading(false));
  }, []);

  return { clients, loading, error };
};
