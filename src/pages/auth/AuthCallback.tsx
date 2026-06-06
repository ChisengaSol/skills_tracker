import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import supabase from "@/lib/supabase";

function AuthCallback() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error("AuthCallback must be used within AuthContextProvider");
  }

  useEffect(() => {
    async function handleCallback() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        navigate("/login");
        return;
      }

      // Check if this is a password recovery flow
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");

      if (type === "recovery") {
        // Redirect to a reset password page
        navigate("/reset-password");
        return;
      }

      // Otherwise it's an email confirmation — go to dashboard
      navigate("/dashboard");
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="auth-callback">
      <p>Verifying, please wait...</p>
    </div>
  );
}

export default AuthCallback;