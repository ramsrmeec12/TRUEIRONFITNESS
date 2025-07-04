import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState(null);
  const [completedFoods, setCompletedFoods] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState([]);
  const queryParams = useQuery();
  const email = queryParams.get("email");
  const today = new Date().toISOString().split("T")[0]; // e.g., 2025-07-04

  useEffect(() => {
    const fetchClient = async () => {
      const q = query(collection(db, "clients"), where("email", "==", email));
      const snapshot = await getDocs(q);
      const docData = snapshot.docs[0];
      if (docData) setClientData({ id: docData.id, ...docData.data() });
    };

    const fetchProgress = async () => {
      const ref = doc(db, "client_progress", `${email}_${today}`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCompletedFoods(snap.data().completedFoods || []);
        setCompletedWorkouts(snap.data().completedWorkouts || []);
      }
    };

    if (email) {
      fetchClient();
      fetchProgress();
    }
  }, [email, today]);

  const handleCheckbox = async (type, itemLabel) => {
    const isCompleted =
      type === "food"
        ? completedFoods.includes(itemLabel)
        : completedWorkouts.includes(itemLabel);

    const newCompleted = type === "food"
      ? isCompleted
        ? completedFoods.filter(f => f !== itemLabel)
        : [...completedFoods, itemLabel]
      : isCompleted
        ? completedWorkouts.filter(w => w !== itemLabel)
        : [...completedWorkouts, itemLabel];

    const data = {
      clientEmail: email,
      date: today,
      completedFoods: type === "food" ? newCompleted : completedFoods,
      completedWorkouts: type === "workout" ? newCompleted : completedWorkouts,
    };

    await setDoc(doc(db, "client_progress", `${email}_${today}`), data);

    type === "food" ? setCompletedFoods(newCompleted) : setCompletedWorkouts(newCompleted);
  };

  const renderFoodSection = () => {
    const foodData = clientData.assignedFood || {};
    const meals = Object.keys(foodData);

    if (meals.length === 0) return <p>No food plan assigned.</p>;

    return meals.map((meal, idx) => (
      <div key={idx} className="mb-4">
        <h4 className="font-semibold text-blue-700">{meal}</h4>
        <ul className="ml-4 space-y-2">
          {foodData[meal].map((food, i) => {
            const label = `${meal}_${food.name}`;
            return (
              <li key={i} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={completedFoods.includes(label)}
                  onChange={() => handleCheckbox("food", label)}
                />
                {food.name} – {food.grams}g ({food.calories} kcal)
              </li>
            );
          })}
        </ul>
      </div>
    ));
  };

  const renderWorkoutSection = () => {
    const workouts = clientData.assignedWorkout?.list || [];

    if (!workouts.length) return <p>No workout assigned.</p>;

    return (
      <ul className="space-y-2">
        {workouts.map((w, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={completedWorkouts.includes(w.name)}
              onChange={() => handleCheckbox("workout", w.name)}
            />
            {w.name} ({w.sets || 3}x{w.reps || 10})
          </li>
        ))}
      </ul>
    );
  };

  if (!clientData) return <p className="text-center mt-10 text-xl">Loading client data...</p>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Welcome, {clientData.name}</h2>
        <ul className="text-gray-800 space-y-2">
          <li><strong>Email:</strong> {clientData.email}</li>
          <li><strong>Phone:</strong> {clientData.phone}</li>
          <li><strong>DOB:</strong> {clientData.dob}</li>
          <li><strong>Gender:</strong> {clientData.gender}</li>
          <li><strong>Height:</strong> {clientData.height} cm</li>
          <li><strong>Weight:</strong> {clientData.weight} kg</li>
          <li><strong>Transformation:</strong> {clientData.transformationType}</li>
        </ul>
      </div>

      {/* Assigned Food Section */}
      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-3">🍽️ Today's Food Plan</h3>
        {renderFoodSection()}
      </div>

      {/* Assigned Workout Section */}
      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">🏋️ Today's Workout Plan</h3>
        {renderWorkoutSection()}
      </div>
    </div>
  );
}
