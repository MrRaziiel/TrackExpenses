import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getClients } from "../../../services/ClientService";
// deleteClient
const ClientList = () => {
  const [clients, setClients] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Buscar clientes ao carregar o componente
  useEffect(() => {
    const fetchClients = async () => {
      const data = await getClients();
      console.log(data);
      setClients(data);
    };
    fetchClients();
  }, []);

  return (
    <div className="text-center p-6">
      <h1 className="text-3xl font-bold text-primary mb-4">Welcome</h1>

      <Link
        to="/edit-client"
        className="bg-secondary text-white px-4 py-2 rounded-md hover:bg-secondary-dark transition"
      >
        CREATE NEW
      </Link>

      {Array.isArray(clients) && clients.length > 0 ? (
        <table className="w-full mt-6 border border-borderColor">
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-borderColor">
                <td className="p-2 font-semibold text-left">First Name:</td>
                <td className="p-2 text-left">{client.firstName}</td>
                <td className="p-2 space-x-4 text-left">
                  <Link
                    to={`/edit-client/${client.id}`}
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition"
                  >
                    EDIT
                  </Link>

                  <button
                    onClick={() => setDeleteConfirm(client.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition"
                  >
                    DELETE
                  </button>

                  {deleteConfirm === client.id && (
                    <div className="mt-2 text-left">
                      <p className="text-red-600 mb-2">Are you sure you want to delete?</p>
                      <button
                        onClick={() => handleDelete(client.id)}
                        className="bg-red-700 text-white px-4 py-2 rounded-md hover:bg-red-800"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="ml-2 px-4 py-2 border border-gray-500 rounded-md hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-6 text-gray-500">No clients found.</p>
      )}
    </div>
  );
};

export default ClientList;