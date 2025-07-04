import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function TrainerLogin() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const allowedEmail = "owner@example.com"; // use your actual allowed email here

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === allowedEmail) {
      navigate("/dashboard", { state: { email } });
    } else {
      alert("❌ Invalid trainer email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">Trainer Login</h2>
        <input
          type="email"
          placeholder="Enter trainer email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
