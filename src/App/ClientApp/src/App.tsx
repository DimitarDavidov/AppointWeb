import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { UserRoles } from "./constants/roles";
import Account from "./pages/Account";
import AdminPanel from "./pages/AdminPanel";
import ProviderPanel from "./pages/ProviderPanel";
import Appointments from "./pages/Appointments";
import ForgotPassword from "./pages/ForgotPassword";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";
import ServiceDetail from "./pages/ServiceDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/book/:providerId/:serviceId"
            element={<ServiceDetail />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute roles={[UserRoles.Provider, UserRoles.Admin]} />}>
            <Route path="/provider" element={<ProviderPanel />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/account" element={<Account />} />
            <Route path="/appointments" element={<Appointments />} />
          </Route>
          <Route element={<ProtectedRoute roles={[UserRoles.Admin]} />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
