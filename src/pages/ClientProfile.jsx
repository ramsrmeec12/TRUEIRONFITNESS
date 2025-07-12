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
  const [planDates, setPlanDates] = useState({ from: "", to: "" });

  const meals = [
    "Empty Stomach or Pre Workout",
    "Early Morning (6:30–7:00 AM)",
    "Breakfast or Post Workout",
    "Mid Morning (11:00 AM)",
    "Lunch",
    "Afternoon (12:30–1:00 PM)",
    "Evening",
    "Late Evening or Post Workout",
    "Post Workout",
    "Dinner",
    "Night",
    "30 min Before Bed"
  ];

  const muscleGroups = ["chest", "back", "shoulders", "legs", "arms", "core"];

  useEffect(() => {
    const fetchData = async () => {
      const clientSnap = await getDoc(doc(db, "clients", id));
      const clientData = clientSnap.data();
      setClient(clientData);





      if (clientData.planDates) {
        setPlanDates(clientData.planDates);
      }


      // Load assigned food
      if (clientData.assignedFood) {
        const initial = {};
        meals.forEach(meal => {
          initial[meal] = clientData.assignedFood[meal] || [];
        });
        setAssignedFood(initial);
      }


      // Load assigned essentials
      if (clientData.assignedEssentials) {
        const initial = {};
        meals.forEach(meal => {
          initial[meal] = clientData.assignedEssentials[meal] || [];
        });
        setAssignedEssentials(initial);
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
    };

    fetchData();
  }, [id]);




  const getActiveDays = () => {
    if (!client?.createdAt) return "-";
    const createdDate = client.createdAt.toDate(); // convert Firestore Timestamp to JS Date
    const today = new Date();
    const diffTime = today - createdDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // convert ms to days
    return diffDays;
  };

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
      planDates, // <-- add this
    });
    alert("✅ Plan saved!");
  };

  const calculateMealMacros = (meal) => {
    const items = assignedFood[meal] || [];
    let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    items.forEach(item => {
      const grams = item.grams || 0;
      const factor = grams / 100;

      total.calories += (item.calories || 0) * factor;
      total.protein += (item.protein || 0) * factor;
      total.carbs += (item.carbs || 0) * factor;
      total.fat += (item.fat || 0) * factor;
    });

    return {
      calories: total.calories.toFixed(0),
      protein: total.protein.toFixed(1),
      carbs: total.carbs.toFixed(1),
      fat: total.fat.toFixed(1),
    };
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


  if (!client) return <div className="p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <h2 className="text-3xl font-bold text-center mb-6">
        Assign Food & Workout for {client.name}
      </h2>
      {client.transformationType && (
        <div className="text-center text-red-600 text-4xl font-semibold mb-6">
          {client.transformationName}
        </div>
      )}


      <div className="bg-yellow-50 p-4 rounded-xl shadow-md text-center mb-8">
        <h4 className="text-xl font-semibold">🍽️ Daily Nutrition Summary</h4>
        <p>Calories: <strong>{calories}</strong> kcal</p>
        <p>Protein: <strong>{protein}</strong> g | Carbs: <strong>{carbs}</strong> g | Fat: <strong>{fat}</strong> g</p>
      </div>

      <div className="text-center text-sm text-gray-700 mb-6">
        Client active for: <span className="text-red-600 font-semibold">{getActiveDays()}</span> days
      </div>


      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-3 mb-5">
        <div>
          <label className="font-medium mr-2">Diet and Workout For:</label>
          <input
            type="date"
            value={planDates.from}
            onChange={(e) => setPlanDates((prev) => ({ ...prev, from: e.target.value }))}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="font-medium mr-2">To:</label>
          <input
            type="date"
            value={planDates.to}
            onChange={(e) => setPlanDates((prev) => ({ ...prev, to: e.target.value }))}
            className="border rounded p-1"
          />
        </div>
      </div>




      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {meals.map(meal => (
          <div key={meal} className="bg-white p-4 rounded-xl shadow">
            <h3 className="text-xl font-semibold text-blue-700 mb-3">{meal}</h3>

            {/* Food dropdown */}
            <select
              onChange={(e) => handleSelectFood(meal, e.target.value)}
              className="w-full mb-3 border p-2 rounded"
              value="" // force reset after each selection if needed
            >
              <option value="" hidden>➕ Add Food to {meal}</option>
              {[...foodItems]
                .filter(food => {
                  const assigned = assignedFood[meal] || [];
                  return !assigned.some(f => f.id.toString() === food.id.toString());
                })
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(food => (
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
                <div className="flex flex-col gap-2 mt-1">
                  {assignedEssentials[meal].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs flex items-center">
                        {item.name} –
                        <input
                          type="text"
                          className="ml-2 border px-2 py-1 rounded text-xs w-24"
                          value={item.dosage}
                          onChange={(e) => {
                            const updated = [...assignedEssentials[meal]];
                            updated[idx].dosage = e.target.value;
                            setAssignedEssentials(prev => ({
                              ...prev,
                              [meal]: updated
                            }));
                          }}
                          placeholder="Dosage"
                        />
                      </span>
                      <button
                        className="text-red-600 text-xs"
                        onClick={() =>
                          setAssignedEssentials(prev => ({
                            ...prev,
                            [meal]: prev[meal].filter((_, i) => i !== idx)
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
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
                  if (current.some(item => item.name.toLowerCase() === val.toLowerCase())) {
                    return prev; // prevent duplicates
                  }
                  return {
                    ...prev,
                    [meal]: [...current, { name: val, dosage: "" }]
                  };
                });

                e.target.selectedIndex = 0;
              }}
            >
              <option value="">➕ Add Essential</option>
              {essentialsList
                .filter(item => !(assignedEssentials[meal]?.some(e => e.name === item)))
                .map((item, idx) => (
                  <option key={idx} value={item}>
                    {item}
                  </option>
                ))}
            </select>

            {/* Macros Summary */}
            {(assignedFood[meal] || []).length > 0 && (
              <div className="text-sm mb-2 mt-2 text-gray-700">
                {(() => {
                  const { calories, protein, carbs, fat } = calculateMealMacros(meal);
                  return (
                    <p>
                      <strong>Meal Total:</strong> {calories} kcal | Protein: {protein}g | Carbs: {carbs}g | Fat: {fat}g
                    </p>
                  );
                })()}
              </div>
            )}
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
                  : [...current, {
                    ...w,
                    sets: 0,
                    reps: 0,
                    muscle: selectedMuscle,
                    setBreakdown: {
                      warmup: { sets: 0, reps: 0 },
                      working: { sets: 0, reps: 0 },
                      failure: { sets: 0, reps: 0 },
                      drop: { sets: 0, reps: 0 }
                    }
                  }]

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
                  <ul className="space-y-4 text-sm">
                    {assignedWorkouts.map((w, i) => (
                      <li key={w.id} className="border rounded p-3 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-800">
                            {w.name} – Total Sets: {w.sets || 0} x {w.reps || 10}
                          </span>
                          <button
                            onClick={() => handleToggle(w)}
                            className="text-red-500 text-sm"
                          >
                            ❌
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 text-sm text-gray-700">
                          {["warmup", "working", "failure", "drop"].map((type) => (
                            <div key={type} className="flex flex-col">
                              <label className="capitalize mb-1">{type}</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={w.setBreakdown?.[type]?.sets || 0}
                                  onChange={(e) => {
                                    const newSets = parseInt(e.target.value) || 0;
                                    const updated = assignedWorkouts.map((item) => {
                                      if (item.id === w.id) {
                                        const newBreakdown = {
                                          ...item.setBreakdown,
                                          [type]: {
                                            ...item.setBreakdown?.[type],
                                            sets: newSets
                                          }
                                        };
                                        const totalSets = Object.values(newBreakdown).reduce(
                                          (sum, val) => sum + (val.sets || 0),
                                          0
                                        );
                                        return {
                                          ...item,
                                          setBreakdown: newBreakdown,
                                          sets: totalSets
                                        };
                                      }
                                      return item;
                                    });
                                    setAssignedWorkoutsPerDay((prev) => ({ ...prev, [day]: updated }));
                                  }}
                                  className="border p-1 rounded w-20"
                                  min="0"
                                />
                                <span>x</span>
                                <input
                                  type="number"
                                  value={w.setBreakdown?.[type]?.reps || 0}
                                  onChange={(e) => {
                                    const newReps = parseInt(e.target.value) || 0;
                                    const updated = assignedWorkouts.map((item) => {
                                      if (item.id === w.id) {
                                        return {
                                          ...item,
                                          setBreakdown: {
                                            ...item.setBreakdown,
                                            [type]: {
                                              ...item.setBreakdown?.[type],
                                              reps: newReps
                                            }
                                          }
                                        };
                                      }
                                      return item;
                                    });
                                    setAssignedWorkoutsPerDay((prev) => ({ ...prev, [day]: updated }));
                                  }}
                                  className="border p-1 rounded w-20"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                        </div>


                        <div className="text-xs text-gray-500 mt-1">
                          Breakdown must sum to total sets: <strong>{w.sets}</strong>
                        </div>
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
            generateDietPlanPdf(
              client,
              assignedFood,
              assignedEssentials,
              assignedWorkoutsPerDay,
              planDates // <-- new
            )
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
        >
          📄 Generate PDF Plan
        </button>

      </div>


    </div>
  );
}
