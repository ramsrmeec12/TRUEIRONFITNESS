// Updated ClientProfile with real-time calorie calculation, macros, and daily tracking with date selection

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function ClientProfile() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [assignedFood, setAssignedFood] = useState({ Breakfast: [], Lunch: [], Dinner: [] });
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [workoutOptions, setWorkoutOptions] = useState([]);
  const [assignedWorkout, setAssignedWorkout] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const meals = ["Breakfast", "Lunch", "Dinner"];
  const muscleGroups = ["chest", "back", "shoulders", "legs", "arms", "core"];

  useEffect(() => {
    const fetchData = async () => {
      const clientSnap = await getDoc(doc(db, "clients", id));
      const clientData = clientSnap.data();
      setClient(clientData);

      const foodSnap = await getDocs(collection(db, "foods"));
      const allFoods = foodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFoodItems(allFoods);

      if (clientData.assignedFood) setAssignedFood(clientData.assignedFood);
      if (clientData.assignedWorkout) {
        setAssignedWorkout(clientData.assignedWorkout.list || []);
        setSelectedMuscle(clientData.assignedWorkout.muscle || "");
      }

      const progressSnap = await getDocs(query(collection(db, "client_progress"), where("clientEmail", "==", clientData.email)));
      const historyData = progressSnap.docs.map(doc => doc.data());
      setHistory(historyData);
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!selectedMuscle) return;
      const q = query(collection(db, "workouts"), where("muscle", "==", selectedMuscle));
      const snap = await getDocs(q);
      const results = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), sets: 3, reps: 10 }));
      setWorkoutOptions(results);
    };
    fetchWorkouts();
  }, [selectedMuscle]);

  const handleSelectFood = (meal, foodId) => {
    const food = foodItems.find(f => f.id === foodId);
    if (!food) return;
    const alreadyExists = assignedFood[meal]?.some(f => f.id === foodId);
    if (alreadyExists) return;
    const updated = {
      ...assignedFood,
      [meal]: [...(assignedFood[meal] || []), { ...food, grams: 100 }],
    };
    setAssignedFood(updated);
  };

  const handleQuantityChange = (meal, index, grams) => {
    const updated = { ...assignedFood };
    updated[meal][index].grams = Number(grams);
    setAssignedFood(updated);
  };

  const handleRemoveFood = (meal, index) => {
    const updated = { ...assignedFood };
    updated[meal].splice(index, 1);
    setAssignedFood(updated);
  };

  const handleToggleWorkout = (id) => {
    const exists = assignedWorkout.find(w => w.id === id);
    if (exists) {
      setAssignedWorkout(prev => prev.filter(w => w.id !== id));
    } else {
      const w = workoutOptions.find(w => w.id === id);
      setAssignedWorkout(prev => [...prev, { ...w, sets: 3, reps: 10 }]);
    }
  };

  const updateWorkoutField = (index, field, value) => {
    const updated = [...assignedWorkout];
    updated[index][field] = value;
    setAssignedWorkout(updated);
  };

  const savePlan = async () => {
    await updateDoc(doc(db, "clients", id), {
      assignedFood,
      assignedWorkout: {
        muscle: selectedMuscle,
        list: assignedWorkout,
      },
    });
    alert("✅ Plan saved!");
  };

  const getTotalCaloriesAndMacros = () => {
    let calories = 0, protein = 0, carbs = 0, fat = 0;
    Object.values(assignedFood).forEach(items => {
      items.forEach(f => {
        const factor = f.grams / 100;
        calories += f.calories * factor;
        protein += (f.protein || 0) * factor;
        carbs += (f.carbs || 0) * factor;
        fat += (f.fat || 0) * factor;
      });
    });
    return {
      calories: calories.toFixed(0),
      protein: protein.toFixed(1),
      carbs: carbs.toFixed(1),
      fat: fat.toFixed(1)
    };
  };

  const { calories, protein, carbs, fat } = getTotalCaloriesAndMacros();

  const selectedEntry = history.find(entry => entry.date === selectedDate);

  if (!client) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        Assign Food & Workout for {client.name}
      </h2>

      <div className="bg-yellow-50 p-4 rounded-xl shadow-md text-center mb-8">
        <h4 className="text-xl font-semibold">🍽️ Daily Nutrition Summary</h4>
        <p>Calories: <strong>{calories}</strong> kcal</p>
        <p>Protein: <strong>{protein}</strong> g | Carbs: <strong>{carbs}</strong> g | Fat: <strong>{fat}</strong> g</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {meals.map(meal => (
          <div key={meal} className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">{meal}</h3>
            <select
              onChange={(e) => handleSelectFood(meal, e.target.value)}
              className="w-full mb-3 border p-2 rounded"
              defaultValue=""
            >
              <option value="" disabled>➕ Add Food to {meal}</option>
              {foodItems.map(food => (
                <option key={food.id} value={food.id}>
                  {food.name} ({food.calories} kcal)
                </option>
              ))}
            </select>
            <ul className="space-y-2">
              {(assignedFood[meal] || []).map((food, index) => (
                <li key={index} className="flex items-center justify-between text-sm">
                  <div>
                    {food.name} –
                    <input
                      type="number"
                      value={food.grams}
                      onChange={(e) => handleQuantityChange(meal, index, e.target.value)}
                      className="w-20 ml-2 border p-1 rounded text-sm"
                    /> g ≈ {(food.calories * food.grams / 100).toFixed(0)} kcal
                  </div>
                  <button
                    onClick={() => handleRemoveFood(meal, index)}
                    className="text-red-500 text-sm ml-2"
                  >❌</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-xl shadow max-w-3xl mx-auto mb-6">
        <h3 className="text-xl font-semibold mb-3 text-indigo-600">🏋️ Assign Workout Plan</h3>
        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value)}
          className="w-full border p-2 rounded mb-4"
        >
          <option value="">Select Muscle Group</option>
          {muscleGroups.map(muscle => (
            <option key={muscle} value={muscle}>{muscle}</option>
          ))}
        </select>

        {selectedMuscle && workoutOptions.length > 0 && (
          <div className="space-y-3">
            {workoutOptions.map((w, index) => {
              const checked = assignedWorkout.some(item => item.id === w.id);
              const assigned = assignedWorkout.find(item => item.id === w.id);
              return (
                <div key={w.id} className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleWorkout(w.id)}
                    />
                    {w.name} ({w.equipment || "No Equipment"})
                  </label>
                  {checked && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={assigned?.sets || 3}
                        onChange={(e) => updateWorkoutField(index, "sets", +e.target.value)}
                        className="w-14 border p-1 rounded text-sm"
                      />
                      x
                      <input
                        type="number"
                        value={assigned?.reps || 10}
                        onChange={(e) => updateWorkoutField(index, "reps", +e.target.value)}
                        className="w-14 border p-1 rounded text-sm"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-center mb-12">
        <button
          onClick={savePlan}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
        >
          ✅ Save Food & Workout Plan
        </button>
      </div>

      <div className="bg-white p-5 rounded-xl shadow max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">📅 Daily Tracking History</h3>
        <div className="mb-4">
          <label className="block mb-1 font-medium">Select Date:</label>
          <input
            type="date"
            className="border p-2 rounded w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        {!selectedEntry ? (
          <p className="text-gray-600">No record found for the selected date.</p>
        ) : (
          <div className="p-3 bg-slate-50 rounded border">
            <strong>Date:</strong> {selectedEntry.date}<br />
            <strong>Foods Taken:</strong> {selectedEntry.completedFoods?.join(", ") || "None"}<br />
            <strong>Workouts Done:</strong> {selectedEntry.completedWorkouts?.join(", ") || "None"}<br />
            <strong>Estimated Calories:</strong> {
              selectedEntry.completedFoods?.reduce((sum, label) => {
                const [, foodName] = label.split("_");
                let food = null;
                Object.values(assignedFood).flat().forEach(f => {
                  if (f.name === foodName) food = f;
                });
                return sum + (food ? (food.calories * (food.grams / 100)) : 0);
              }, 0).toFixed(0)
            } kcal
          </div>
        )}
      </div>
    </div>
  );
}
