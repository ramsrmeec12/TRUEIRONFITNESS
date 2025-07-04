// Home.jsx (Landing Page)
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <h1 className="text-4xl font-bold mb-8 text-blue-900">Welcome to FitTrack</h1>
      <div className="flex gap-6">
        <button
          onClick={() => navigate("/client-login")}
          className="bg-white px-6 py-3 rounded-lg shadow hover:bg-blue-50 border border-blue-500 text-blue-700 font-medium"
        >
          Client Login
        </button>
        <button
          onClick={() => navigate("/trainer-login")}
          className="bg-blue-600 px-6 py-3 rounded-lg shadow hover:bg-blue-700 text-white font-medium"
        >
          Trainer Login
        </button>
      </div>
    </div>
  );
}
