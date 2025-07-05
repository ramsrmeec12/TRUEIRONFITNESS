import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold mb-6">Gym Owner Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        <Link to="/add-client" className="dashboard-link">➕ Add Client</Link>
        <Link to="/view-clients" className="dashboard-link">👥 View Clients</Link>
        <Link to="/add-food" className="dashboard-link">🥗 Add Food Item</Link>
        <Link to="/add-workout" className="dashboard-link">🏋️ Add Workout</Link>
        <Link to="/essentials" className="dashboard-link">💉 Add Essentials</Link>
        
      </div>
    </div>
  );
}
