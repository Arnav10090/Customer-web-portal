import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsLoggedIn(true);
      } catch (error) {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    // Retrieve users from localStorage
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = users.find((u) => (u.email === email || u.username === email) && u.password === password);
    
    if (foundUser) {
      const userData = { email: foundUser.email, username: foundUser.username };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      return { success: true };
    }
    return { success: false, error: "Invalid email/username or password" };
  };

  const register = (formData) => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    
    // Check if user already exists
    if (users.some((u) => u.email === formData.email || u.username === formData.username)) {
      return { success: false, error: "Email or username already exists" };
    }
    
    // Add new user
    users.push({
      email: formData.email,
      username: formData.username,
      password: formData.password,
      phone: formData.phone,
      company_name: formData.company_name,
    });
    
    localStorage.setItem("users", JSON.stringify(users));
    
    // Auto-login after registration
    const userData = { email: formData.email, username: formData.username };
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setIsLoggedIn(true);
    
    return { success: true };
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, register, logout, loading }}>
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
