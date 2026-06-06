import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthSidebar from "../../components/AuthSidebar";
import supabase from "@/lib/supabase";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import "../../styles/auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validSession, setValidSession] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check there is a valid recovery session before showing the form
    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        navigate("/login");
        return;
      }

      setValidSession(true);
    }

    checkSession();
  }, [navigate]);

  function isStrongPassword(password: string) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Password updated successfully. Redirecting to login...");

    setTimeout(() => {
      navigate("/login");
    }, 2000);
  }

  if (!validSession) {
    return null;
  }

  return (
    <div className="register-layout">
      <AuthSidebar />

      <main className="register-main">
        <div className="register-form-container">
          <h2 className="register-title">Reset your password</h2>
          <p className="register-subtitle">
            Enter a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label>New password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm new password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Toggle confirm password visibility"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Updating..." : "Update password"}
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;