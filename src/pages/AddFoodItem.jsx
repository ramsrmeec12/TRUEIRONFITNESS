import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function AddFoodItem() {
  const [food, setFood] = useState({
    name: "",
    protein: "",
    carbs: "",
    fat: "",
    calories: 0,
  });

  const [existingFoods, setExistingFoods] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedFood, setEditedFood] = useState({});

  const calculateCalories = (protein, carbs, fat) => {
    return protein * 4 + carbs * 4 + fat * 9;
  };

  const fetchFoods = async () => {
    const snap = await getDocs(collection(db, "foods"));
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setExistingFoods(items);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...food, [name]: value };

    const protein = parseFloat(updated.protein) || 0;
    const carbs = parseFloat(updated.carbs) || 0;
    const fat = parseFloat(updated.fat) || 0;

    updated.calories = calculateCalories(protein, carbs, fat);
    setFood(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "foods"), food);
      alert("✅ Food item added successfully!");
      setFood({ name: "", protein: "", carbs: "", fat: "", calories: 0 });
      fetchFoods();
    } catch (err) {
      console.error("Error adding food:", err);
    }
  };

  const handleSaveEdit = async (id) => {
    const { name, protein, carbs, fat } = editedFood;
    const newCalories = calculateCalories(protein, carbs, fat);
    const foodRef = doc(db, "foods", id);

    await updateDoc(foodRef, {
      name,
      protein,
      carbs,
      fat,
      calories: newCalories,
    });

    setEditingId(null);
    setEditedFood({});
    fetchFoods();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this food item?")) {
      try {
        await deleteDoc(doc(db, "foods", id));
        fetchFoods();
      } catch (err) {
        console.error("Error deleting food:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 to-slate-700 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add Food Item
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <input
            name="name"
            value={food.name}
            onChange={handleChange}
            type="text"
            placeholder="Food Name (e.g., Soya)"
            className="input"
            required
          />
          <input
            name="protein"
            value={food.protein}
            onChange={handleChange}
            type="number"
            placeholder="Protein (g)"
            className="input"
            required
          />
          <input
            name="carbs"
            value={food.carbs}
            onChange={handleChange}
            type="number"
            placeholder="Carbs (g)"
            className="input"
            required
          />
          <input
            name="fat"
            value={food.fat}
            onChange={handleChange}
            type="number"
            placeholder="Fat (g)"
            className="input"
            required
          />
          <div className="col-span-full text-center mt-2 text-lg font-semibold text-slate-800 dark:text-white">
            Total Calories: {food.calories} kcal
          </div>
          <button
            type="submit"
            className="col-span-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
          >
            ➕ Add Food Item
          </button>
        </form>

        <div>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
            🧾 Existing Food Items
          </h3>
          {existingFoods.length === 0 ? (
            <p className="text-gray-500">No food items added yet.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {[...existingFoods]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <li
                    key={item.id}
                    className="border-b pb-1 text-white flex flex-col gap-1"
                  >
                    <div className="flex justify-between items-center">
                      {editingId === item.id ? (
                        <input
                          type="text"
                          value={editedFood.name}
                          onChange={(e) =>
                            setEditedFood({
                              ...editedFood,
                              name: e.target.value,
                            })
                          }
                          className="text-black px-2 py-1 rounded w-full mb-1"
                        />
                      ) : (
                        <strong>{item.name}</strong>
                      )}

                      <div className="space-x-2">
                        {editingId === item.id ? (
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-green-500 text-xs font-semibold"
                          >
                            💾 Save
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditedFood({
                                name: item.name,
                                protein: item.protein,
                                carbs: item.carbs,
                                fat: item.fat,
                              });
                            }}
                            className="text-blue-400 text-xs font-semibold"
                          >
                            ✏️ Edit
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 text-xs font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>

                    {editingId === item.id ? (
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="number"
                          value={editedFood.protein}
                          onChange={(e) =>
                            setEditedFood({
                              ...editedFood,
                              protein: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Protein"
                          className="text-black px-2 py-1 rounded"
                        />
                        <input
                          type="number"
                          value={editedFood.carbs}
                          onChange={(e) =>
                            setEditedFood({
                              ...editedFood,
                              carbs: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Carbs"
                          className="text-black px-2 py-1 rounded"
                        />
                        <input
                          type="number"
                          value={editedFood.fat}
                          onChange={(e) =>
                            setEditedFood({
                              ...editedFood,
                              fat: parseFloat(e.target.value),
                            })
                          }
                          placeholder="Fat"
                          className="text-black px-2 py-1 rounded"
                        />
                      </div>
                    ) : (
                      <span>
                        {item.protein}g P / {item.carbs}g C / {item.fat}g F –{" "}
                        {item.calories} kcal
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
