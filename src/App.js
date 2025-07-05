import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientLogin from "./pages/ClientLogin";
import ClientDashboard from "./pages/ClientDashboard";
import Dashboard from "./pages/Dashboard";
import AddClient from "./pages/AddClient";
import ViewClients from "./pages/ViewClients";
import AddFoodItem from "./pages/AddFoodItem";
import AddWorkout from "./pages/AddWorkout";
import ClientProfile from "./pages/ClientProfile";
import Home from "./pages/Home";
import TrainerLogin from "./pages/TrainerLogin";
import EssentialsManager from "./pages/Essentials";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home></Home>}></Route>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-client" element={<AddClient />} />
        <Route path="/view-clients" element={<ViewClients />} />
        <Route path="/add-food" element={<AddFoodItem />} />
        <Route path="/add-workout" element={<AddWorkout />} />
        <Route path="/client-login" element={<ClientLogin />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
        <Route path="/client/:id" element={<ClientProfile />} />
        <Route path="/trainer-login" element={<TrainerLogin></TrainerLogin>}></Route>
        <Route path="/essentials" element={<EssentialsManager />} />
        

      </Routes>
    </BrowserRouter>
  );
}

export default App;
