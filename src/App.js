import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import CustomerPortal from "./components/CustomerPortal";
import Login from "./components/Login";
import Register from "./components/Register";

function AppContent() {
  const { isLoggedIn, loading } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  // Reset to login page whenever user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setAuthPage("login");
    }
  }, [isLoggedIn]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return authPage === "login" ? (
      <Login onSwitchToRegister={() => setAuthPage("register")} />
    ) : (
      <Register onSwitchToLogin={() => setAuthPage("login")} />
    );
  }

  return <CustomerPortal />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
