import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState(null);
  const mealOrder = ["Breakfast", "Lunch", "Dinner"];
  const workoutDaysOrder = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];
  const queryParams = useQuery();
  const email = queryParams.get("email");
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClient = async () => {
      const q = query(collection(db, "clients"), where("email", "==", email));
      const snapshot = await getDocs(q);
      const docData = snapshot.docs[0];
      if (docData) setClientData({ id: docData.id, ...docData.data() });
    };

    if (email) {
      fetchClient();
    }
  }, [email, today]);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate("/client-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const renderFoodSection = () => {
    const foodData = clientData.assignedFood || {};
    const essentialsData = clientData.assignedEssentials || {};

    const meals = mealOrder.filter(meal => foodData[meal]); // Only keep defined meals

    if (meals.length === 0) return <p>No food plan assigned.</p>;

    return meals.map((meal, idx) => (
      <div key={idx} className="mb-6">
        <h4 className="font-semibold text-blue-700 mb-2">{meal}</h4>
        <ul className="ml-4 space-y-2 mb-2 text-sm">
          {foodData[meal].map((food, i) => (
            <li key={i}>
              {food.name} – {food.grams}g ({food.calories} kcal)
            </li>
          ))}
        </ul>

        <div className="ml-4">
          <strong className="block text-sm text-gray-700 mb-1">Essentials:</strong>
          {(essentialsData[meal]?.length > 0) ? (
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              {essentialsData[meal].map((item, idx) => (
                <li key={idx}>
                  {item.name} {item.dosage ? `– ${item.dosage}` : ""}
                </li>
              ))}
            </ul>

          ) : (
            <p className="text-sm text-gray-500 ml-1">No essentials assigned.</p>
          )}
        </div>
      </div>
    ));
  };


  const renderWorkoutSection = () => {
    const dayWiseWorkouts = clientData.assignedWorkoutPerDay || {};

    const sortedDays = workoutDaysOrder.filter(day => dayWiseWorkouts[day]);

    if (!sortedDays.length) return <p>No workout plan assigned.</p>;

    return sortedDays.map((day, idx) => {
      const workouts = dayWiseWorkouts[day];
      if (!Array.isArray(workouts) || workouts.length === 0) return null;

      return (
        <div key={idx} className="mb-4">
          <h4 className="font-semibold text-indigo-700 mb-2">{day}</h4>
          <ul className="ml-4 space-y-2 text-sm">
            {workouts.map((w, i) => (
              <li key={i}>
                {w.name} ({w.sets || 3}x{w.reps || 10})
              </li>
            ))}
          </ul>
        </div>
      );
    });
  };

  const calculateBMI = () => {
    if (clientData?.height && clientData?.weight) {
      const h = clientData.height / 100;
      return (clientData.weight / (h * h)).toFixed(1);
    }
    return "-";
  };

  if (!clientData) return <p className="text-center mt-10 text-xl">Loading client data...</p>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <div className="w-full max-w-md flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="text-red-600 font-semibold hover:underline"
        >
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md mb-8">
        <h2 className="text-2xl font-bold text-center mb-4">Welcome, {clientData.name}</h2>
        <ul className="text-gray-800 space-y-2">
          <li><strong>Email:</strong> {clientData.email}</li>
          <li><strong>Phone:</strong> {clientData.phone}</li>
          <li><strong>DOB:</strong> {clientData.dob}</li>
          <li><strong>Gender:</strong> {clientData.gender}</li>
          <li><strong>Height:</strong> {clientData.height} cm</li>
          <li><strong>Weight:</strong> {clientData.weight} kg</li>
          <li><strong>BMI:</strong> {calculateBMI()}</li>
          <li><strong>Transformation:</strong> {clientData.transformationType}</li>
          <li><strong>Food Preference:</strong> {clientData.foodPreference || "Not specified"}</li>
        </ul>
      </div>

      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md mb-6">
        <h3 className="text-lg font-semibold mb-3">🍽️ Today's Food Plan</h3>
        {renderFoodSection()}
      </div>

      <div className="bg-white p-5 rounded-xl shadow w-full max-w-md">
        <h3 className="text-lg font-semibold mb-3">🏋️ Today's Workout Plan</h3>
        {renderWorkoutSection()}
      </div>
    </div>
  );
}
