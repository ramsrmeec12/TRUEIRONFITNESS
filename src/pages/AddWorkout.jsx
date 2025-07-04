import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AddWorkout() {
  const [workout, setWorkout] = useState({
    name: "",
    sets: "",
    reps: "",
    muscle: "",
    equipment: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkout({ ...workout, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "workouts"), workout);
      alert("Workout added successfully!");
      setWorkout({ name: "", sets: "", reps: "", muscle: "", equipment: "" });
    } catch (err) {
      console.error("Error adding workout:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add Workout
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={workout.name}
            onChange={handleChange}
            type="text"
            placeholder="Workout Name (e.g., Bench Press)"
            className="input"
            required
          />
          <input
            name="sets"
            value={workout.sets}
            onChange={handleChange}
            type="number"
            placeholder="Sets"
            className="input"
            required
          />
          <input
            name="reps"
            value={workout.reps}
            onChange={handleChange}
            type="number"
            placeholder="Reps"
            className="input"
            required
          />
          <select
            name="muscle"
            value={workout.muscle}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Target Muscle</option>
            <option value="chest">Chest</option>
            <option value="back">Back</option>
            <option value="shoulders">Shoulders</option>
            <option value="legs">Legs</option>
            <option value="arms">Arms</option>
            <option value="core">Core</option>
          </select>
          <input
            name="equipment"
            value={workout.equipment}
            onChange={handleChange}
            type="text"
            placeholder="Equipment (e.g., Dumbbells)"
            className="input"
          />

          <button
            type="submit"
            className="col-span-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
          >
            Add Workout
          </button>
        </form>
      </div>
    </div>
  );
}
