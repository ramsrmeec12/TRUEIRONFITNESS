import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirect to client dashboard if already logged in
        navigate(`/client-dashboard?email=${user.email}`);
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      navigate(`/client-dashboard?email=${result.user.email}`);
    } catch (err) {
      alert("Login failed!");
      console.error(err);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      alert("Please enter your email to reset password.");
      return;
    }

    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert("✅ Password reset email sent! Check your inbox.");
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Failed to send reset email.");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg grid gap-4"
      >
        <h2 className="text-xl font-bold text-center">Client Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input border p-2 rounded"
          required
        />

        <button className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
          Login
        </button>

        <p
          className="text-sm text-center mt-2 text-blue-600 cursor-pointer hover:underline"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </p>
      </form>
    </div>
  );
}
