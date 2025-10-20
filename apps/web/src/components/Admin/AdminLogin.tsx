import { HEY_API_URL } from "@hey/data/constants";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface AdminLoginProps {
  onLoginSuccess?: (token: string) => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${HEY_API_URL}/admin-panel/login`, {
        body: JSON.stringify({ password, username: email }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      console.log("Login response:", data);
      const token = data.token;

      // Store token in localStorage
      localStorage.setItem("authToken", token);

      // Call success callback
      if (onLoginSuccess) {
        onLoginSuccess(token);
      }

      // Navigate to admin dashboard
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center font-extrabold text-3xl text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-gray-400 text-sm">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label className="sr-only" htmlFor="email">
                Email
              </label>
              <input
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                id="email"
                name="email"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                type="email"
                value={email}
              />
            </div>
            <div className="relative">
              <label className="sr-only" htmlFor="password">
                Password
              </label>
              <input
                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-600 bg-gray-800 px-3 py-2 pr-10 text-white placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                id="password"
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-900/20 p-4">
              <div className="text-red-200 text-sm">{error}</div>
            </div>
          )}

          <div>
            <button
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
