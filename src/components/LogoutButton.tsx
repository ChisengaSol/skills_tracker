import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LogOut } from "lucide-react";
import "../styles/dashboard.css";

function LogoutButton() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <button onClick={handleLogout} className="logout-btn">
      <LogOut size={16} />
      Sign out
    </button>
  );
}

export default LogoutButton;