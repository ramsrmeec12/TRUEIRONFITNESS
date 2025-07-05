import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

export default function EssentialsManager() {
  const [essentials, setEssentials] = useState([]);
  const [newEssential, setNewEssential] = useState({
    name: "",
    dosage: ""
  });

  const fetchEssentials = async () => {
    const snap = await getDocs(collection(db, "essentials"));
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEssentials(list);
  };

  useEffect(() => {
    fetchEssentials();
  }, []);

  const handleAdd = async () => {
    if (!newEssential.name || !newEssential.dosage) return alert("Fill all fields.");
    await addDoc(collection(db, "essentials"), newEssential);
    setNewEssential({ name: "", dosage: "" });
    fetchEssentials();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "essentials", id));
    fetchEssentials();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold text-center mb-6">💊 Manage Essentials</h2>

      <div className="max-w-md mx-auto bg-white p-4 rounded-xl shadow mb-8">
        <h4 className="text-lg font-semibold mb-3">➕ Add Essential</h4>
        <input
          type="text"
          placeholder="Name (e.g., Multivitamin)"
          className="w-full border p-2 rounded mb-2"
          value={newEssential.name}
          onChange={(e) => setNewEssential(prev => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="text"
          placeholder="Dosage (e.g., 1 tablet)"
          className="w-full border p-2 rounded mb-3"
          value={newEssential.dosage}
          onChange={(e) => setNewEssential(prev => ({ ...prev, dosage: e.target.value }))}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          onClick={handleAdd}
        >
          Add Essential
        </button>
      </div>

      <div className="max-w-md mx-auto">
        <h4 className="text-xl font-semibold mb-3">📋 Essentials List</h4>
        <ul className="space-y-3">
          {essentials.map(item => (
            <li key={item.id} className="bg-white p-3 rounded shadow flex justify-between items-center">
              <div>
                <strong>{item.name}</strong><br />
                <span className="text-sm text-gray-600">💊 Dosage: {item.dosage}</span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
