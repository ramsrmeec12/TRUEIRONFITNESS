import { useState, useEffect } from "react";
import { db } from "../firebase";
import { updateDoc } from "firebase/firestore";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function EssentialsManager() {
  const [essentials, setEssentials] = useState([]);
  const [newEssential, setNewEssential] = useState({
    name: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");

  const handleEditStart = (id, currentName) => {
    setEditingId(id);
    setEditedName(currentName);
  };

  const handleSaveEdit = async (id) => {
    if (!editedName.trim()) return alert("Name cannot be empty.");
    await updateDoc(doc(db, "essentials", id), { name: editedName });
    setEditingId(null);
    setEditedName("");
    fetchEssentials();
  };


  const fetchEssentials = async () => {
    const snap = await getDocs(collection(db, "essentials"));
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setEssentials(list);
  };

  useEffect(() => {
    fetchEssentials();
  }, []);

  const handleAdd = async () => {
    if (!newEssential.name.trim()) {
      return alert("Enter essential name.");
    }
    await addDoc(collection(db, "essentials"), newEssential);
    setNewEssential({ name: "" });
    alert("✅ Essential added successfully!");
    fetchEssentials();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this essential?")) {
      await deleteDoc(doc(db, "essentials", id));
      fetchEssentials();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          💊 Manage Essentials
        </h2>

        {/* Add Essential */}
        <div className="mb-8">
          <h4 className="text-xl font-semibold text-slate-700 dark:text-white mb-3">
            ➕ Add Essential
          </h4>
          <input
            type="text"
            placeholder="Name (e.g., Multivitamin)"
            className="w-full border border-gray-300 rounded-xl px-4 py-2 mb-3 text-black"
            value={newEssential.name}
            onChange={(e) =>
              setNewEssential((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-xl transition"
          >
            ➕ Add Essential
          </button>
        </div>

        {/* List Essentials */}
        <div>
          <h4 className="text-xl font-semibold text-slate-700 dark:text-white mb-3">
            📋 Essentials List
          </h4>
          <ul className="space-y-3">
            {essentials.map((item) => (
              <li
                key={item.id}
                className="bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl shadow flex justify-between items-center"
              >
                {editingId === item.id ? (
                  <>
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-black px-2 py-1 rounded w-full mr-2"
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="text-green-500 hover:underline text-sm font-semibold ml-2"
                    >
                      💾 Save
                    </button>
                  </>
                ) : (
                  <>
                    <strong>{item.name}</strong>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStart(item.id, item.name)}
                        className="text-blue-400 hover:underline text-sm font-semibold"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:underline text-sm font-semibold"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  );
}
