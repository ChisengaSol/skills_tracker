import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AuthCallback from "./pages/auth/AuthCallback";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/auth/ResetPassword";
// import Skills from "./pages/Skills";
// import SkillDetail from "./pages/SkillDetail";
// import Categories from "./pages/Categories";
// import Profile from "./pages/Profile";

const router = createBrowserRouter([
  // Auth routes
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/auth/callback", element: <AuthCallback /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // App routes
  { path: "/dashboard", element: <Dashboard /> },
//   { path: "/skills", element: <Skills /> },
//   { path: "/skills/:id", element: <SkillDetail /> },
//   { path: "/categories", element: <Categories /> },
//   { path: "/profile", element: <Profile /> },

  // Default redirect
  { path: "/", element: <Login /> },
]);

export default router;