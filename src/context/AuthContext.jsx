import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Add this flag
    
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");

    const validateToken = async () => {
      if (!isMounted) return; // Add this check
      
      // If we have a refresh token, try to refresh the access token first.
      if (storedUser && refreshToken) {
        try {
          const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
          const resp = await axios.post(`${apiBase}/auth/token/refresh/`, { refresh: refreshToken });
          const newAccess = resp.data?.access;
          if (newAccess && isMounted) { // Add isMounted check
            localStorage.setItem('accessToken', newAccess);
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Refresh token validation failed:', err.response?.data || err.message);
        } 
      }

      // If no refresh token, but an access token exists, try validating it directly
      if (storedUser && accessToken && isMounted) { // Add isMounted check
        try {
          const testInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          await testInstance.get('/auth/user/');
          if (isMounted) { // Add isMounted check
            setUser(JSON.parse(storedUser));
            setIsLoggedIn(true);
            setLoading(false);
          }
          return;
        } catch (err) {
          console.warn('Access token validation failed:', err.response?.data || err.message);
        }
      }

      // No valid token found — clear storage
      if (isMounted) { // Add isMounted check
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsLoggedIn(false);
        setLoading(false);
      }
    };

    validateToken();
    
    return () => {
      isMounted = false; // Cleanup flag
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);
      
      const { user: userData, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      
      // Store user data - map both old and new field names
      const userToStore = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        // Support both old (phone, company_name) and new (telephone) field names
        phone: userData.telephone || userData.phone,
        telephone: userData.telephone,
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        userType: userData.userType,
        empId: userData.empId,
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
        // Map frontend field names to TTMS field names
        firstName: formData.firstname,
        lastName: formData.lastname,
        password: formData.password,
        verify_password: formData.verify_password,
        telephone: formData.phone,
        userType: 'customer', // Default to customer
      });
      
      const { user: userData, tokens } = response.data;
      
      // Store tokens
      localStorage.setItem("accessToken", tokens.access);
      localStorage.setItem("refreshToken", tokens.refresh);
      
      // Store user data - map both old and new field names
      const userToStore = {
        id: userData.id,
        email: userData.email,
        username: userData.username,
        // Support both old (phone, company_name) and new (telephone) field names
        phone: userData.telephone || userData.phone,
        telephone: userData.telephone,
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        userType: userData.userType,
        empId: userData.empId,
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
    
    // Clear form data from localStorage on logout
    localStorage.removeItem("customerPortal_formData");
    localStorage.removeItem("customerPortal_files");
    localStorage.removeItem("customerPortal_currentStep");
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
