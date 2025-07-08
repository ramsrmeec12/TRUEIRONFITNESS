import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { generateDietPlanPdf } from "../utils/generateDietPlanPdf";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "../firebase";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ClientDashboard() {
  const [clientData, setClientData] = useState(null);
  const meals = [
    "Empty Stomach",
    "Early Morning (6:30–7:00 AM)",
    "Breakfast ",
    "Mid Morning (11:00 AM)",
    "Lunch",
    "Afternoon (12:30–1:00 PM)",
    "Evening",
    "Late Evening",
    "Post Workout",
    "Dinner",
    "Night",
    "30 min Before Bed"
  ];

  const foodData = clientData?.assignedFood || {};
  const essentialsData = clientData?.assignedEssentials || {};

  const mealOrder = meals.filter(
    meal =>
      (foodData[meal] && foodData[meal].length > 0) ||
      (essentialsData[meal] && essentialsData[meal].length > 0)
  );

  const workoutDaysOrder = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];
  const queryParams = useQuery();
  const email = queryParams.get("email");
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    // Check if user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/client-login");
      }
    });

    const fetchClient = async () => {
      if (!email) return;
      const q = query(collection(db, "clients"), where("email", "==", email));
      const snapshot = await getDocs(q);
      const docData = snapshot.docs[0];
      if (docData) setClientData({ id: docData.id, ...docData.data() });
    };

    fetchClient();

    return () => unsubscribe();
  }, [email, navigate]);

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      navigate("/client-login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  function formatDate(isoString) {
    if (!isoString) return "-";
    const [year, month, day] = isoString.split("-");
    return `${day}-${month}-${year}`;
  }



  const renderFoodSection = () => {
    const foodData = clientData?.assignedFood || {};
    const essentialsData = clientData?.assignedEssentials || {};
    const meals = mealOrder.filter(meal =>
      (foodData[meal] && foodData[meal].length > 0) ||
      (essentialsData[meal] && essentialsData[meal].length > 0)
    );



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
          <strong className="block text-sm  mb-1">Essentials:</strong>
          {(essentialsData[meal]?.length > 0) ? (
            <ul className="list-disc list-inside text-sm  space-y-1 pl-4">
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
            {workouts.map((w, i) => {
              const hasBreakdown = w.setBreakdown && Object.values(w.setBreakdown).some(val => typeof val === "object" && val.sets > 0);
              return (
                <li key={i} className="mb-2">
                  <div className="font-medium">{w.name}</div>
                  {hasBreakdown ? (
                    <ul className="ml-4 text-gray-300 pl-4 text-sm list-disc">
                      {["warmup", "working", "failure", "drop"].map((type) => {
                        const breakdown = w.setBreakdown?.[type];
                        if (breakdown?.sets > 0) {
                          return (
                            <li key={type}>
                              {type}: {breakdown.sets} x {breakdown.reps}
                            </li>
                          );
                        }
                        return null;
                      })}
                    </ul>
                  ) : (
                    <div className="ml-4 text-sm text-gray-400"> Sets: {w.sets || 3} Reps: {w.reps || 10}</div>
                  )}

                </li>
              );
            })}
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
    <div className="min-h-screen bg-black text-white px-4 py-6">

      {/* Logo centered */}
      <div className="flex justify-center mb-6">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-24 h-auto drop-shadow-lg"
        />
      </div>

      {/* Logout button */}
      <div className="w-full max-w-2xl mx-auto flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="text-red-500 hover:underline font-medium"
        >
          Logout
        </button>
      </div>

      {/* Welcome Card */}
      <div className="bg-[#111] p-6 rounded-2xl shadow-lg w-full max-w-2xl mx-auto mb-8 border border-gray-700">
        <h2 className="text-3xl font-bold text-center text-blue-500 mb-5">
          Welcome, {clientData.name}
        </h2>
        <h1 className="text-3xl font-bold text-center text-red-700 mb-5">{clientData.transformationName}</h1>
        <ul className="space-y-2 text-sm">
          <li><span className="text-gray-400">📧 Email:</span> {clientData.email}</li>
          <li><span className="text-gray-400">📞 Phone:</span> {clientData.phone}</li>
          <li><span className="text-gray-400">🎂 DOB:</span> {clientData.dob}</li>
          <li><span className="text-gray-400">⚧ Gender:</span> {clientData.gender}</li>
          <li><span className="text-gray-400">📏 Height:</span> {clientData.height} cm</li>
          <li><span className="text-gray-400">⚖ Weight:</span> {clientData.weight} kg</li>
          <li><span className="text-gray-400">📊 BMI:</span> {calculateBMI()}</li>
          <li>
            <span className="text-gray-400">🔥 Transformation:</span>{" "}
            <span className="text-red-500 font-semibold">{clientData.transformationType}</span>
          </li>
          <li><span className="text-gray-400">🥗 Food Preference:</span> {clientData.dietType || "Not specified"}</li>

          <h3 className="py-5">*Any changes to the above details should be reported to the trainer.</h3>
        </ul>
      </div>

      {/* Download Button */}
      <div className="text-center mt-8 mb-8">
        <button
          onClick={() =>
            generateDietPlanPdf(
              clientData,
              clientData.assignedFood || {},
              clientData.assignedEssentials || {},
              clientData.assignedWorkoutPerDay || {},
              clientData.planDates || {},
            )
          }
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-md transition"
        >
          📄 Download My Full Plan (PDF)
        </button>
      </div>

      <p className="text-center text-md  my-4">
        Diet & Workout Plan For:{" "}
        <span className=" font-semibold">
          {formatDate(clientData?.planDates?.from)} to {formatDate(clientData?.planDates?.to)}
        </span>
      </p>




      {/* Food Plan */}
      <div className="bg-[#111] p-6 rounded-2xl shadow-lg w-full max-w-2xl mx-auto mb-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-blue-400 mb-4">🍽️ Today's Food Plan</h3>
        {renderFoodSection()}
      </div>

      {/* Workout Plan */}
      <div className="bg-[#111] p-6 rounded-2xl shadow-lg w-full max-w-2xl mx-auto mb-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-blue-400 mb-4">🏋️ Today's Workout Plan</h3>
        {renderWorkoutSection()}
      </div>


    </div>
  );



}
