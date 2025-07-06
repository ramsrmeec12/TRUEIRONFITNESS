import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
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

  const calculateCalories = (protein, carbs, fat) => {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  };

  const fetchFoods = async () => {
    const snap = await getDocs(collection(db, "foods"));
    const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExistingFoods(items);
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = {
      ...food,
      [name]: value,
    };


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
      fetchFoods(); // refresh the list
    } catch (err) {
      console.error("Error adding food:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 to-slate-700 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add Food Item
        </h2>

        php-template
        Copy
        Edit
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">🧾 Existing Food Items</h3>
          {existingFoods.length === 0 ? (
            <p className="text-gray-500">No food items added yet.</p>
          ) : (
            <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
              {[...existingFoods]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                  <li key={item.id} className="border-b pb-1 text-white">
                    {item.name} – {item.protein}g P / {item.carbs}g C / {item.fat}g F – {item.calories} kcal
                  </li>
                ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}