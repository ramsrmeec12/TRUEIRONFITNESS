import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebase";
import emailjs from "@emailjs/browser";
import { Timestamp } from "firebase/firestore";


export default function AddClient() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    dob: "",
    gender: "",
    transformationType: "",
    transformationName: "", // <-- new field
    dietType: "",
    height: "",
    weight: "",
  });


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const sendEmail = async () => {
    try {
      await emailjs.send(
        "service_qlw4qwm",           // ✅ Updated service ID
        "template_aka75xb",         // ✅ Updated template ID
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        "2qTeKZKnsrHZPZJCc"          // ✅ Updated public key
      );
      console.log("✅ Email sent");
    } catch (error) {
      console.error("❌ Failed to send email:", error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      // Step 1: Create user in Firebase Authentication
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      // Step 2: Store data in Firestore with creation timestamp
      await addDoc(collection(db, "clients"), {
        ...formData,
        createdAt: Timestamp.now(),
      });

      // Step 3: Send welcome email
      await sendEmail();

      alert("Client account created and email sent!");
      setFormData({
        name: "",
        phone: "",
        email: "",
        password: "",
        dob: "",
        gender: "",
        transformationType: "",
        transformationName: "",
        dietType: "",
        height: "",
        weight: "",
      });
    } catch (error) {
      console.error("❌ Error adding client:", error.message);
      alert("Error: " + error.message);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Add New Client
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" type="text" placeholder="Full Name" value={formData.name} onChange={handleChange} className="input" required />
          <input name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="input" required />
          <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="input" required />
          <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="input" required />
          <input name="dob" type="date" value={formData.dob} onChange={handleChange} className="input" required />
          <select name="gender" value={formData.gender} onChange={handleChange} className="input" required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <select name="transformationType" value={formData.transformationType} onChange={handleChange} className="input" required>
            <option value="">Transformation Type</option>
            <option value="weight loss">Weight Loss</option>
            <option value="weight gain">Weight Gain</option>
            <option value="body recomposition">Body Recomposition</option>
            <option value="competition preparation">Competition Preparation</option>
          </select>
          <select name="dietType" value={formData.dietType || ""} onChange={handleChange} className="input" required>
            <option value="">Diet Type</option>
            <option value="veg">Veg</option>
            <option value="nonveg">Non-Veg</option>
          </select>
          <input name="height" type="number" placeholder="Height (cm)" value={formData.height} onChange={handleChange} className="input" required />
          <input name="weight" type="number" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} className="input" required />
          <input
            name="transformationName"
            type="text"
            placeholder="Transformation Name (e.g. 100 Days Challenge)"
            value={formData.transformationName}
            onChange={handleChange}
            className="input"
            required
          />

          <button type="submit" className="col-span-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-all">
            Add Client
          </button>
        </form>
      </div>
    </div>
  );
}
