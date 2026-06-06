import { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSidebar from "../../components/AuthSidebar";
import { AuthContext } from "@/context/AuthContext";
import supabase from "@/lib/supabase";
import { ArrowRight, ArrowLeft } from "lucide-react";
import "../../styles/auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    throw new Error("ForgotPassword must be used within AuthContextProvider");
  }

  const { session } = auth;

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Check your email for a password reset link.");
  }

  return (
    <div className="register-layout">
      <AuthSidebar />

      <main className="register-main">
        <div className="register-form-container">
          <h2 className="register-title">Forgot your password?</h2>
          <p className="register-subtitle">
            Enter your email and we'll send you a reset link.
          </p>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="user1@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Sending..." : "Send reset link"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="login-link">
            <Link to="/login" className="back-link">
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;