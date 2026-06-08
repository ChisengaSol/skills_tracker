import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import ResetPassword from "./pages/auth/ResetPassword";
import Goals from "./pages/Goals";
import Skills from "./pages/Skills";
import AppLayout from "./components/AppLayout";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // Protected routes
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <Dashboard /> },
      { path: "/settings", element: <Settings /> },
      { path: "/goals", element: <Goals /> },
      { path: "/skills", element: <Skills /> },
      { path: "/profile", element: <Profile /> },
    ]
  },

  { path: "/", element: <Navigate to="/login" replace /> },
]);

export default router;