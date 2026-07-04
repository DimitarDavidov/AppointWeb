import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import Account from "./pages/Account";
import AdminPanel from "./pages/AdminPanel";
import Appointments from "./pages/Appointments";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/account" element={<Account />} />
          <Route path="/appointments" element={<Appointments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
