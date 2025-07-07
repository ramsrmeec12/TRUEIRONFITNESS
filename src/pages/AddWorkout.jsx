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

export default function AddWorkout() {
  const [workout, setWorkout] = useState({
    name: "",
    muscle: "",
    equipment: "",
  });

  const [workouts, setWorkouts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedWorkout, setEditedWorkout] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setWorkout({ ...workout, [name]: value });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditedWorkout({ ...editedWorkout, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "workouts"), workout);
      alert("✅ Workout added successfully!");
      setWorkout({ name: "", muscle: "", equipment: "" });
      fetchWorkouts();
    } catch (err) {
      console.error("Error adding workout:", err);
    }
  };

  const fetchWorkouts = async () => {
    const snap = await getDocs(collection(db, "workouts"));
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setWorkouts(items);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setEditedWorkout({
      name: item.name,
      muscle: item.muscle,
      equipment: item.equipment,
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const ref = doc(db, "workouts", id);
      await updateDoc(ref, editedWorkout);
      setEditingId(null);
      setEditedWorkout({});
      fetchWorkouts();
    } catch (err) {
      console.error("Error updating workout:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this workout?")) {
      try {
        await deleteDoc(doc(db, "workouts", id));
        fetchWorkouts();
      } catch (err) {
        console.error("Error deleting workout:", err);
      }
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const muscle = workout.muscle || "Others";
    if (!acc[muscle]) acc[muscle] = [];
    acc[muscle].push(workout);
    return acc;
  }, {});

  const sortedMuscles = Object.keys(groupedWorkouts).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-2xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add Workout
        </h2>

        {/* Add Workout Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          <input
            name="name"
            value={workout.name}
            onChange={handleChange}
            type="text"
            placeholder="Workout Name (e.g., Bench Press)"
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
            required
          />
          <button
            type="submit"
            className="col-span-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
          >
            ➕ Add Workout
          </button>
        </form>

        {/* Grouped Workouts */}
        <p className="text-white mt-0 mb-3">*please check below before adding the workout</p>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
          🏋️ Workouts By Muscle Already added
        </h3>
        
        {sortedMuscles.length === 0 ? (
          <p className="text-gray-500">No workouts added yet.</p>
        ) : (
          <div className="space-y-6">
            {sortedMuscles.map((muscle) => (
              <div key={muscle}>
                <h4 className="text-lg font-bold text-blue-300 capitalize mb-2">
                  {muscle}
                </h4>
                <ul className="space-y-2 text-sm">
                  {groupedWorkouts[muscle].map((item) => (
                    <li
                      key={item.id}
                      className="border-b pb-1 text-white flex flex-col gap-1"
                    >
                      {editingId === item.id ? (
                        <>
                          <input
                            type="text"
                            name="name"
                            value={editedWorkout.name}
                            onChange={handleEditChange}
                            placeholder="Workout Name"
                            className="text-black px-2 py-1 rounded"
                          />
                          <select
                            name="muscle"
                            value={editedWorkout.muscle}
                            onChange={handleEditChange}
                            className="text-black px-2 py-1 rounded"
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
                            type="text"
                            name="equipment"
                            value={editedWorkout.equipment}
                            onChange={handleEditChange}
                            placeholder="Equipment"
                            className="text-black px-2 py-1 rounded"
                          />
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="text-green-500 text-xs font-semibold mt-1"
                          >
                            💾 Save
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <strong>{item.name}</strong>
                            <div className="space-x-2">
                              <button
                                onClick={() => handleEdit(item)}
                                className="text-blue-400 text-xs font-semibold"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 text-xs font-semibold"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-300">
                            Muscle: {item.muscle} | Equipment: {item.equipment}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
