import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthSidebar from "../../components/AuthSidebar";
import { AuthContext } from "@/context/AuthContext";
import supabase from "@/lib/supabase";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import "../../styles/auth.css";

const GithubIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="none"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    throw new Error("Login must be used within AuthContextProvider");
  }

  const { session } = auth;

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  async function handleGithubLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("invalid")) {
        setError("Invalid email or password.");
      } else {
        setError(error.message);
      }
      return;
    }

    navigate("/dashboard");
  }

  return (
    <div className="register-layout">
      <AuthSidebar />

      <main className="register-main">
        <div className="register-form-container">
          <h2 className="register-title">Welcome back</h2>
          <p className="register-subtitle">
            Sign in to continue tracking your learning.
          </p>

          <button
            type="button"
            className="github-btn"
            onClick={handleGithubLogin}
          >
            <GithubIcon size={18} />
            Continue with GitHub
          </button>

          <div className="divider">
            <span>or</span>
          </div>

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

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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

            <div className="form-options-row">
              <Link to="/forgot-password" className="forgot-password">
                Forgot password?
              </Link>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Signing in..." : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="login-link">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;