import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

function LogoutButton() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <button onClick={handleLogout} className="logout-btn">
      Sign out
    </button>
  );
}

export default LogoutButton;