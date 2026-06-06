import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthSidebar from "../../components/AuthSidebar";
import { AuthContext } from "@/context/AuthContext";
import supabase from "@/lib/supabase";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import "../../styles/auth.css";

type FormDataType = {
  fullname: string;
  email: string;
  password: string;
};

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

function Register() {
  const [formData, setFormData] = useState<FormDataType>({
    fullname: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  if (!auth) {
    throw new Error("Register must be used within AuthContextProvider");
  }

  const { session } = auth;

  useEffect(() => {
    if (session) {
      navigate("/dashboard");
    }
  }, [session, navigate]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function isStrongPassword(password: string) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  }

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
    setSuccess("");

    if (!isStrongPassword(formData.password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullname,
        },
      },
    });

    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setError("This email is already registered.");
      } else {
        setError(error.message);
      }
      return;
    }

    setSuccess("Check your email for a verification link.");
  }

  return (
    <div className="register-layout">
      <AuthSidebar />

      <main className="register-main">
        <div className="register-form-container">
          <h2 className="register-title">Create your account</h2>
          <p className="register-subtitle">
            Start tracking your skills and hit your goals.
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
              <label>Full name</label>
              <input
                type="text"
                name="fullname"
                placeholder="e.g User One"
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                placeholder="user1@gmail.com"
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  onChange={handleChange}
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

            {error && <p className="error-text">{error}</p>}
            {success && <p className="success-text">{success}</p>}

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Creating..." : "Create account"}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className="login-link">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;