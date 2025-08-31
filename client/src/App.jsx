import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";
import BookAppointment from "./pages/BookAppointment";
import MyBookings from "./pages/MyBookings";
import ManageUsers from "./pages/ManageUsers";
import AuditLogs from "./pages/AuditLogs";
import Profile from "./pages/Profile";
import AvailableSlots from "./pages/AvailableSlots";
import TestPage from "./pages/TestPage";
import AdvisorManagement from "./pages/AdvisorManagement";
import AdminDashboard from "./pages/AdminDashboard";
import FinanceManagerDashboard from "./pages/FinanceManagerDashboard";
import InventoryManagerDashboard from "./pages/InventoryManagerDashboard";
import StaffManagerDashboard from "./pages/StaffManagerDashboard";
import BookingsManagement from "./pages/BookingsManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import { AuthProvider } from "./store/auth.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <div className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/book" element={<RoleGuard roles={["user"]}><BookAppointment /></RoleGuard>} />
            <Route path="/bookings" element={<RoleGuard roles={["user"]}><MyBookings /></RoleGuard>} />
            <Route path="/available-slots" element={<RoleGuard roles={["user"]}><AvailableSlots /></RoleGuard>} />
            <Route path="/manage-users" element={<RoleGuard roles={["manager", "admin"]}><ManageUsers /></RoleGuard>} />
            <Route path="/audit-logs" element={<RoleGuard roles={["manager", "admin"]}><AuditLogs /></RoleGuard>} />
            <Route path="/profile" element={<RoleGuard roles={["user"]}><Profile /></RoleGuard>} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/advisor-management" element={<RoleGuard roles={["manager", "admin"]}><AdvisorManagement /></RoleGuard>} />
            <Route path="/bookings-management" element={<RoleGuard roles={["manager", "admin", "advisor"]}><BookingsManagement /></RoleGuard>} />
            <Route path="/admin-dashboard" element={<RoleGuard roles={["admin"]}><AdminDashboard /></RoleGuard>} />
            <Route path="/finance-dashboard" element={<RoleGuard roles={["finance_manager", "admin"]}><FinanceManagerDashboard /></RoleGuard>} />
            <Route path="/inventory-dashboard" element={<RoleGuard roles={["inventory_manager", "admin"]}><InventoryManagerDashboard /></RoleGuard>} />
            <Route path="/staff-dashboard" element={<RoleGuard roles={["staff_manager", "admin"]}><StaffManagerDashboard /></RoleGuard>} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
