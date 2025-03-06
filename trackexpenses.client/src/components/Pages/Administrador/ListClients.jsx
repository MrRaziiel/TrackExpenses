import { useState } from "react";
import { Link } from "react-router-dom";

const ClientList = ({ clients }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  return (
    <div className="text-center p-6">
      <h1 className="text-3xl font-bold text-primary">Welcome</h1>
      <Link to="/edit-client" className="bg-secondary text-white px-4 py-2 rounded-md">CREATE NEW</Link>
      <br />
      {clients && clients.length > 0 ? (
        <table className="w-full mt-6 border border-borderColor">
          <tbody>
            {clients.map((client) => (
              <>
                <tr key={client.id} className="border-b border-borderColor">
                  <td className="p-2 font-semibold">FirstName:</td>
                  <td className="p-2">{client.FirstName}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">FamilyName:</td>
                  <td className="p-2">{client.FamilyName}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">Birthday:</td>
                  <td className="p-2">{client.Birthday}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">ProfileImageId:</td>
                  <td className="p-2">{client.ProfileImageId}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">Password:</td>
                  <td className="p-2">{client.Password}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">GroupId:</td>
                  <td className="p-2">{client.GroupId}</td>
                </tr>
                <tr className="border-b border-borderColor">
                  <td className="p-2 font-semibold">GroupInvite:</td>
                  <td className="p-2">{client.GroupOfClients?.CodeInvite}</td>
                </tr>
                <tr>
                  <td colSpan={2} className="p-2 space-x-4">
                    <Link
                      to={`/edit-client/${client.Id}`}
                      className="bg-primary text-white px-4 py-2 rounded-md"
                    >
                      EDIT
                    </Link>
                    <button
                      onClick={() => confirmDelete(client.Id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                    >
                      DELETE
                    </button>
                    {deleteConfirm === client.Id && (
                      <div className="mt-2">
                        <p className="text-red-600">Are you sure you want to delete?</p>
                        <button
                          onClick={() => console.log("Deleting", client.Id)}
                          className="bg-red-700 text-white px-4 py-2 rounded-md"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="ml-2 px-4 py-2 border border-gray-500 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4 text-gray-500">No clients found.</p>
      )}
    </div>
  );
};

export default ClientList;