import { BrowserRouter, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Users from "./pages/Users";

// Placeholders for other teams' pages (they will replace these)
import Products from "./pages/Products";
import Plans from "./pages/Plans";
import Subscriptions from "./pages/Subscriptions";
import Billing from "./pages/Billing";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Dashboard from "./pages/Dashboard";

import "./App.css";

function NavBar() {
  const role = localStorage.getItem("role");

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    window.location.href = "/login";
  }

  if (!role) return null;

  return (
    <nav className="navbar">
      <span className="navbar-brand">💡 Brightloop Billing</span>
      <div className="nav-links">
        {/* Admin sees all */}
        {role === "admin" && (
          <>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/plans">Plans</NavLink>
            <NavLink to="/users">Users</NavLink>
          </>
        )}

        {/* Admin + Staff */}
        {(role === "admin" || role === "staff") && (
          <>
            <NavLink to="/subscriptions">Subscriptions</NavLink>
            <NavLink to="/billing">Billing</NavLink>
            <NavLink to="/invoices">Invoices</NavLink>
            <NavLink to="/payments">Payments</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
          </>
        )}

        {/* Customer */}
        {role === "customer" && (
          <>
            <NavLink to="/subscriptions">My Subscriptions</NavLink>
            <NavLink to="/invoices">My Invoices</NavLink>
          </>
        )}
      </div>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

function PrivateRoute({ children, roles }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(role)) return <Navigate to="/login" replace />;
  return children;
}

function DefaultRedirect() {
  const role = localStorage.getItem("role");
  if (!role) return <Navigate to="/login" replace />;
  if (role === "customer") return <Navigate to="/subscriptions" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/products" element={
            <PrivateRoute roles={["admin"]}><Products /></PrivateRoute>
          } />
          <Route path="/plans" element={
            <PrivateRoute roles={["admin"]}><Plans /></PrivateRoute>
          } />
          <Route path="/users" element={
            <PrivateRoute roles={["admin"]}><Users /></PrivateRoute>
          } />
          <Route path="/subscriptions" element={
            <PrivateRoute roles={["admin", "staff", "customer"]}><Subscriptions /></PrivateRoute>
          } />
          <Route path="/billing" element={
            <PrivateRoute roles={["admin", "staff"]}><Billing /></PrivateRoute>
          } />
          <Route path="/invoices" element={
            <PrivateRoute roles={["admin", "staff", "customer"]}><Invoices /></PrivateRoute>
          } />
          <Route path="/payments" element={
            <PrivateRoute roles={["admin", "staff"]}><Payments /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute roles={["admin", "staff"]}><Dashboard /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
