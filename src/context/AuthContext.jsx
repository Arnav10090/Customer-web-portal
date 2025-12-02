import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    if (storedUser && accessToken) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (err) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);
      
      const { user: userData, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      
      // Store user data
      const userToStore = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        phone: userData.phone,
        company_name: userData.company_name,
      };
      localStorage.setItem("user", JSON.stringify(userToStore));
      
      setUser(userToStore);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.detail ||
                          "Login failed. Please check your credentials.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (formData) => {
    try {
      setError(null);
      const response = await authAPI.register({
        email: formData.email,
        username: formData.username,
        first_name: formData.firstname,
        last_name: formData.lastname,
        password: formData.password,
        verify_password: formData.verify_password,
        phone: formData.phone,
        company_name: formData.company_name,
      });
      
      const { user: userData, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      
      // Store user data
      const userToStore = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        phone: userData.phone,
        company_name: userData.company_name,
      };
      localStorage.setItem("user", JSON.stringify(userToStore));
      
      setUser(userToStore);
      setIsLoggedIn(true);
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.email?.[0] ||
                          err.response?.data?.username?.[0] ||
                          err.response?.data?.password?.[0] ||
                          err.response?.data?.detail ||
                          "Registration failed. Please try again.";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setIsLoggedIn(false);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
