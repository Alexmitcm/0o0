import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminPanel from "./index";

const AdminRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const storedToken =
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("authToken");

      if (storedToken) {
        // Verify token is valid by checking if it's not expired
        try {
          const payload = JSON.parse(atob(storedToken.split(".")[1]));
          const currentTime = Date.now() / 1000;

          if (payload.exp && payload.exp > currentTime) {
            setToken(storedToken);
            setIsAuthenticated(true);
          } else {
            // Token expired
            localStorage.removeItem("authToken");
            sessionStorage.removeItem("authToken");
            setIsAuthenticated(false);
          }
        } catch {
          // Invalid token
          localStorage.removeItem("authToken");
          sessionStorage.removeItem("authToken");
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    sessionStorage.removeItem("authToken");
    setToken(null);
    setIsAuthenticated(false);
    navigate("/");
  };

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Header */}
      <div className="border-gray-700 border-b bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <h1 className="font-semibold text-white text-xl">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">Welcome, Admin</span>
              <button
                className="rounded-md bg-red-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-red-700"
                onClick={handleLogout}
                type="button"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminPanel />
      </div>
    </div>
  );
};

export default AdminRoute;
