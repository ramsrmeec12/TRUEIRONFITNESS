import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import Dashboard from "./pages/Dashboard";
import AddClient from "./pages/AddClient";
import ViewClients from "./pages/ViewClients";
import AddFoodItem from "./pages/AddFoodItem";
import AddWorkout from "./pages/AddWorkout";
import ClientProfile from "./pages/ClientProfile";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/add-client" element={<AddClient />} />
        <Route path="/view-clients" element={<ViewClients />} />
        <Route path="/add-food" element={<AddFoodItem />} />
        <Route path="/add-workout" element={<AddWorkout />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/client/:id" element={<ClientProfile />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
