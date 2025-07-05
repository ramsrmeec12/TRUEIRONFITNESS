import { useParams } from "react-router-dom";
import { useEffect, useState } from "react"
import { generateDietPlanPdf } from "../utils/generateDietPlanPdf";



import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../firebase";

export default function ClientProfile() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [essentialsList, setEssentialsList] = useState([]);
  const [assignedFood, setAssignedFood] = useState({ Breakfast: [], Lunch: [], Dinner: [] });
  const [assignedEssentials, setAssignedEssentials] = useState({ Breakfast: [], Lunch: [], Dinner: [] });
  const [selectedMusclesPerDay, setSelectedMusclesPerDay] = useState({});
  const [assignedWorkoutsPerDay, setAssignedWorkoutsPerDay] = useState({});
  const [workoutOptionsMap, setWorkoutOptionsMap] = useState({});




  const [history, setHistory] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const meals = ["Breakfast", "Lunch", "Dinner"];
  const muscleGroups = ["chest", "back", "shoulders", "legs", "arms", "core"];

  useEffect(() => {
    const fetchData = async () => {
      const clientSnap = await getDoc(doc(db, "clients", id));
      const clientData = clientSnap.data();
      setClient(clientData);


      // Load assigned food
      if (clientData.assignedFood) {
        setAssignedFood(clientData.assignedFood);
      }

      // Load assigned essentials
      if (clientData.assignedEssentials) {
        setAssignedEssentials(clientData.assignedEssentials);
      }

      // Load assigned workouts per day
      if (clientData.assignedWorkoutPerDay) {
        setAssignedWorkoutsPerDay(clientData.assignedWorkoutPerDay);

        const muscleMap = {};
        const optionsMap = {};

        for (const [day, workouts] of Object.entries(clientData.assignedWorkoutPerDay)) {
          if (workouts.length > 0) {
            const muscle = workouts[0].muscle || "";
            if (muscle) {
              muscleMap[day] = muscle;
              const options = await fetchWorkoutsByMuscle(muscle);
              optionsMap[day] = options;
            }
          }
        }

        setSelectedMusclesPerDay(muscleMap);
        setWorkoutOptionsMap(optionsMap);
      }

      // Load all foods
      const foodSnap = await getDocs(collection(db, "foods"));
      const allFoods = foodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFoodItems(allFoods);

      // Load essentials list
      const essentialSnap = await getDocs(collection(db, "essentials"));
      const allEssentials = essentialSnap.docs.map(doc => doc.data().name);
      setEssentialsList(allEssentials);

      // Load client progress history
      const progressSnap = await getDocs(
        query(collection(db, "client_progress"), where("clientEmail", "==", clientData.email))
      );
      const historyData = progressSnap.docs.map(doc => doc.data());
      setHistory(historyData);
    };

    fetchData();
  }, [id]);

  const fetchWorkoutsByMuscle = async (muscle) => {
    if (!muscle) return [];
    const q = query(collection(db, "workouts"), where("muscle", "==", muscle));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data(), sets: 3, reps: 10 }));
  };


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



  const savePlan = async () => {
    await updateDoc(doc(db, "clients", id), {
      assignedFood,
      assignedEssentials,
      assignedWorkoutPerDay: assignedWorkoutsPerDay,
      selectedMusclesPerDay,
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

            {/* Food dropdown */}
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

            {/* Food list */}
            <ul className="space-y-2 mb-3">
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

            {/* Essential display */}
            <div className="text-sm mb-2">
              <strong>Essentials:</strong>{" "}
              {assignedEssentials[meal]?.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {assignedEssentials[meal].map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs flex items-center"
                    >
                      {item}
                      <button
                        className="ml-1 text-red-600"
                        onClick={() =>
                          setAssignedEssentials(prev => ({
                            ...prev,
                            [meal]: prev[meal].filter((_, i) => i !== idx)
                          }))
                        }
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500 ml-2">None</span>
              )}
            </div>


            {/* Essential dropdown */}
            <select
              className="w-full mb-3 border p-2 rounded text-sm"
              defaultValue=""
              onChange={(e) => {
                const val = e.target.value.trim();
                if (!val) return;

                setAssignedEssentials(prev => {
                  const current = prev[meal] || [];
                  if (current.some(item => item.toLowerCase() === val.toLowerCase())) {
                    return prev; // prevent duplicates (case-insensitive)
                  }
                  return {
                    ...prev,
                    [meal]: [...current, val]
                  };
                });

                // Reset dropdown to default to allow re-selection
                e.target.selectedIndex = 0;
              }}

            >
              <option value="">➕ Add Essential</option>
              {essentialsList
                .filter(item => !(assignedEssentials[meal]?.includes(item)))
                .map((item, idx) => (
                  <option key={idx} value={item}>
                    {item}
                  </option>
                ))}
            </select>

          </div>
        ))}
      </div>

      {/* Workout Section */}
      <div className="bg-white p-5 rounded-xl shadow max-w-4xl mx-auto mb-6">
        <h3 className="text-xl font-semibold mb-5 text-indigo-600">🏋️ Assign Workout Plan (By Day)</h3>

        {["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"].map((day) => {
          const selectedMuscle = selectedMusclesPerDay[day] || "";
          const assignedWorkouts = assignedWorkoutsPerDay[day] || [];
          const workoutOptions = workoutOptionsMap[day] || [];

          const handleToggle = (w) => {
            setAssignedWorkoutsPerDay(prev => {
              const current = prev[day] || [];
              const exists = current.find(item => item.id === w.id);
              return {
                ...prev,
                [day]: exists
                  ? current.filter(item => item.id !== w.id)
                  : [...current, { ...w, sets: 3, reps: 10, muscle: selectedMuscle }]
              };
            });
          };


          const updateSetRep = (workoutId, field, value) => {
            const updated = assignedWorkouts.map(w => {
              if (w.id === workoutId) {
                return { ...w, [field]: value };
              }
              return w;
            });
            setAssignedWorkoutsPerDay(prev => ({ ...prev, [day]: updated }));
          };

          const handleMuscleChange = async (muscle) => {
            setSelectedMusclesPerDay(prev => ({ ...prev, [day]: muscle }));
            const options = await fetchWorkoutsByMuscle(muscle);
            setWorkoutOptionsMap(prev => ({ ...prev, [day]: options }));
          };

          return (
            <div key={day} className="mb-6 border-t pt-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">{day}</h4>

              <select
                value={selectedMuscle}
                onChange={(e) => handleMuscleChange(e.target.value)}
                className="w-full border p-2 rounded mb-3"
              >
                <option value="">Select Muscle Group</option>
                {muscleGroups.map(muscle => (
                  <option key={muscle} value={muscle}>{muscle}</option>
                ))}
              </select>

              {selectedMuscle && (
                <div className="space-y-3 mb-3">
                  {workoutOptions.map((w, idx) => {
                    const checked = assignedWorkouts.some(item => item.id === w.id);
                    const assigned = assignedWorkouts.find(item => item.id === w.id);
                    return (
                      <div key={w.id} className="flex items-center justify-between">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggle(w)}
                          />
                          {w.name} ({w.equipment || "No Equipment"})
                        </label>
                        {checked && (
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              value={assigned?.sets || 3}
                              onChange={(e) => updateSetRep(w.id, "sets", +e.target.value)}
                              className="w-14 border p-1 rounded text-sm"
                            />
                            x
                            <input
                              type="number"
                              value={assigned?.reps || 10}
                              onChange={(e) => updateSetRep(w.id, "reps", +e.target.value)}
                              className="w-14 border p-1 rounded text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {assignedWorkouts.length > 0 && (
                <div className="bg-slate-100 p-3 rounded">
                  <h5 className="text-md font-bold mb-2 text-indigo-700">Assigned Workouts</h5>
                  <ul className="space-y-2 text-sm">
                    {assignedWorkouts.map((w, i) => (
                      <li key={w.id} className="flex justify-between items-center">
                        <span>
                          {w.name} – {w.sets || 3} x {w.reps || 10} reps
                        </span>
                        <button
                          onClick={() => handleToggle(w)}
                          className="text-red-500 text-sm"
                        >❌</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>




      <div className="text-center mb-12">
        <button
          onClick={savePlan}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl"
        >
          ✅ Save Food & Workout Plan
        </button>
      </div>
      <div className="text-center mb-8">
        <button
          onClick={() =>
            generateDietPlanPdf(client, assignedFood, assignedEssentials, assignedWorkoutsPerDay)

          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
        >
          📄 Generate PDF Plan
        </button>
      </div>





      {/* Progress Section */}
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
          <div className="p-4 bg-slate-50 rounded border space-y-4">
            <p><strong>Date:</strong> {selectedEntry.date}</p>

            {/* Foods & Macros by Meal */}
            <div>
              <strong>🍽️ Foods & Macros by Meal:</strong>
              {meals.map(meal => {
                const completed = selectedEntry.completedFoods?.filter(label => label.startsWith(`${meal}_`)) || [];
                const foods = completed.map(label => label.split("_")[1]);

                // Get full food objects
                const foodObjects = Object.values(assignedFood[meal] || []).filter(f => foods.includes(f.name));

                let mealCalories = 0, mealProtein = 0, mealCarbs = 0, mealFat = 0;
                foodObjects.forEach(f => {
                  const factor = f.grams / 100;
                  mealCalories += f.calories * factor;
                  mealProtein += (f.protein || 0) * factor;
                  mealCarbs += (f.carbs || 0) * factor;
                  mealFat += (f.fat || 0) * factor;
                });

                return (
                  <div key={meal} className="ml-4 mt-2 space-y-1">
                    <p className="font-medium text-blue-700">{meal}:</p>
                    {foods.length > 0 ? (
                      <ul className="list-disc list-inside text-sm ml-2">
                        {foodObjects.map((f, idx) => (
                          <li key={idx}>
                            {f.name} – {f.grams}g ≈ {(f.calories * f.grams / 100).toFixed(0)} kcal
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 ml-2">None</p>
                    )}
                    <p className="text-xs ml-2 text-gray-600">
                      Calories: {mealCalories.toFixed(0)} kcal | Protein: {mealProtein.toFixed(1)}g | Carbs: {mealCarbs.toFixed(1)}g | Fat: {mealFat.toFixed(1)}g
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Essentials Taken */}
            <div>
              <strong>💊 Essentials Taken:</strong>
              {meals.map(meal => {
                const essentials = assignedEssentials[meal] || [];
                return (
                  <div key={meal} className="ml-4 mt-1">
                    <span className="font-medium text-green-700">{meal}:</span>{" "}
                    {essentials.length > 0
                      ? essentials.join(", ")
                      : <span className="text-gray-500">None</span>}
                  </div>
                );
              })}
            </div>

            {/* Workouts Done */}
            <div>
              <strong>🏋️ Workouts Done:</strong>{" "}
              {selectedEntry.completedWorkouts?.length > 0
                ? selectedEntry.completedWorkouts.join(", ")
                : <span className="text-gray-500">None</span>}
            </div>

            {/* Total Calories */}
            <div>
              <strong>🔥 Estimated Total Calories:</strong>{" "}
              {
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
          </div>
        )}
      </div>



    </div>
  );
}
