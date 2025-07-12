import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { deleteDoc } from "firebase/firestore";

export default function ViewClients() {
  const [clients, setClients] = useState([]);
  const [editingClient, setEditingClient] = useState(null);
  const navigate = useNavigate();

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent navigation
    const confirmDelete = window.confirm("Are you sure you want to delete this client?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "clients", id));
      setClients(prev => prev.filter(client => client.id !== id));
      alert("Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Error deleting client. Try again.");
    }
  };

  const fetchClients = async () => {
    const snapshot = await getDocs(collection(db, "clients"));
    const clientList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setClients(clientList);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditingClient(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    try {
      const clientRef = doc(db, "clients", editingClient.id);
      const { id, ...updatedData } = editingClient;
      await updateDoc(clientRef, updatedData);
      setEditingClient(null);
      fetchClients();
      alert("Client updated successfully!");
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const renderClientTable = (clientsToRender, title) => (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">{title}</h2>
      <div className="overflow-x-auto shadow-md rounded-xl bg-white p-4">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase bg-slate-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Diet</th> {/* ✅ Added */}
              <th className="px-4 py-3">Height</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Transformation Name</th>

              <th className="px-4 py-3">BMI</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {clientsToRender.map(client => (
              <tr
                key={client.id}
                className="border-t hover:bg-slate-50 cursor-pointer"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <td className="px-4 py-2">{client.name}</td>
                <td className="px-4 py-2">{client.phone}</td>
                <td className="px-4 py-2">{client.email}</td>
                <td className="px-4 py-2">{client.gender}</td>
                <td className="px-4 py-2">{client.transformationType}</td>
                <td className="px-4 py-2 capitalize">{client.dietType || "N/A"}</td> {/* ✅ Added */}
                <td className="px-4 py-2">{client.height} cm</td>
                <td className="px-4 py-2">{client.weight} kg</td>
                <td className="px-4 py-2">{client.transformationName || "N/A"}</td>

                <td className="px-4 py-2">
                  {client.height && client.weight ? (() => {
                    const bmi = client.weight / Math.pow(client.height / 100, 2);
                    return <span>{bmi.toFixed(1)}</span>;
                  })() : "N/A"}
                </td>
                <td className="px-4 py-2">
                  {client.status === "completed" ? (
                    <span className="text-green-700 text-xs bg-green-100 px-2 py-1 rounded">Completed</span>
                  ) : (
                    <span className="text-yellow-700 text-xs bg-yellow-100 px-2 py-1 rounded">Active</span>
                  )}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingClient(client);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, client.id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );

  const activeClients = clients.filter(c => c.status !== "completed");
  const completedClients = clients.filter(c => c.status === "completed");

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-10">Client Management System</h1>
      {renderClientTable(activeClients, "🟢 Active Clients")}
      {renderClientTable(completedClients, "✅ Completed Clients")}

      {/* Edit Modal */}
      {editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Edit Client</h2>
            <div className="grid grid-cols-2 gap-4">
              {["name", "phone", "email", "dob", "height", "weight"].map((field) => (
                <input
                  key={field}
                  name={field}
                  value={editingClient[field]}
                  onChange={handleInputChange}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  className="border rounded px-3 py-2"
                />
              ))}
              <select name="gender" value={editingClient.gender} onChange={handleInputChange} className="border rounded px-3 py-2">
                <option value="">Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              <select name="transformationType" value={editingClient.transformationType} onChange={handleInputChange} className="border rounded px-3 py-2">
                <option value="">Transformation Type</option>
                <option value="fatloss">Fat Loss</option>
                <option value="musclegain">Muscle Gain</option>
                <option value="bodyrecomp">Body Recomp</option>
              </select>
              <select name="dietType" value={editingClient.dietType || ""} onChange={handleInputChange} className="border rounded px-3 py-2">
                <option value="">Diet Type</option>
                <option value="veg">Veg</option>
                <option value="nonveg">Non-Veg</option>
              </select>
              <select name="status" value={editingClient.status || "active"} onChange={handleInputChange} className="border rounded px-3 py-2">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
              <input
                name="transformationName"
                value={editingClient.transformationName || ""}
                onChange={handleInputChange}
                placeholder="Transformation Name"
                className="border rounded px-3 py-2"
              />

            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setEditingClient(null)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded">
                Cancel
              </button>
              <button onClick={handleUpdate} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
