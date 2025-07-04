import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate(`/client-dashboard?email=${email}`);
    } catch (err) {
      alert("Login failed!");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg grid gap-4">
        <h2 className="text-xl font-bold text-center">Client Login</h2>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
        <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">Login</button>
      </form>
    </div>
  );
}
