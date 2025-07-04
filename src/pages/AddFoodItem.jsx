import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AddFoodItem() {
  const [food, setFood] = useState({
    name: "",
    protein: "",
    carbs: "",
    fat: "",
    calories: 0,
    category: "",
  });

  const calculateCalories = (protein, carbs, fat) => {
    return (protein * 4) + (carbs * 4) + (fat * 9);
  };

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
      alert("Food item added successfully!");
      setFood({ name: "", protein: "", carbs: "", fat: "", calories: 0, category: "" });
    } catch (err) {
      console.error("Error adding food:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-slate-900 to-slate-700 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add Food Item
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={food.name}
            onChange={handleChange}
            type="text"
            placeholder="Food Name (e.g., Soya)"
            className="input"
            required
          />
          <select
            name="category"
            value={food.category}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select Category</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
            <option value="Snacks">Snacks</option>
            <option value="Pre-workout">Pre-workout</option>
          </select>
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
            Add Food Item
          </button>
        </form>
      </div>
    </div>
  );
}
