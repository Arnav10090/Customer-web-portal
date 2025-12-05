import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader, Truck, Mail, Lock, User, Phone, Building } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstname: "",
    lastname: "",
    password: "",
    verify_password: "",
    phone: "",
    company_name: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { register } = useAuth();

  const formatPhoneValue = (value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      return "";
    }
    const withoutCountry = digits.startsWith("91") ? digits.slice(2) : digits;
    const trimmed = withoutCountry.slice(0, 10);
    return trimmed ? `+91${trimmed}` : "";
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    }

    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.verify_password) {
      newErrors.verify_password = "Please confirm your password";
    } else if (formData.password !== formData.verify_password) {
      newErrors.verify_password = "Passwords do not match";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+91\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone must follow +91XXXXXXXXXX format";
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    let nextValue = value;
    if (field === "phone") {
      nextValue = formatPhoneValue(value);
    }
    setFormData((prev) => ({ ...prev, [field]: nextValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await register({
        email: formData.email.trim(),
        username: formData.username.trim(),
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        password: formData.password,
        verify_password: formData.verify_password,
        phone: formData.phone,
        company_name: formData.company_name.trim(),
      });

      if (result.success) {
        setSuccessMessage("Account created successfully! Redirecting...");
        setTimeout(() => {
          // User is already logged in via the register function
        }, 1500);
      } else {
        setSubmitError(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <Truck className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Gate Entry</h1>
          </div>

          <p className="text-center text-sm text-gray-600 mb-6">
            Create an account to access the Customer Gate Entry Portal
          </p>

          {submitError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.email
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  placeholder="Choose a username"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.username
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.username}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    id="firstname"
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => handleInputChange("firstname", e.target.value)}
                    placeholder="John"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      errors.firstname
                        ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                        : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.firstname && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.firstname}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                  <input
                    id="lastname"
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => handleInputChange("lastname", e.target.value)}
                    placeholder="Doe"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      errors.lastname
                        ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                        : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                    }`}
                    disabled={loading}
                  />
                </div>
                {errors.lastname && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.lastname}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="At least 8 characters"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.password
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="verify_password" className="block text-sm font-medium text-gray-700 mb-2">
                Verify Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="verify_password"
                  type={showVerifyPassword ? "text" : "password"}
                  value={formData.verify_password}
                  onChange={(e) => handleInputChange("verify_password", e.target.value)}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.verify_password
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                  disabled={loading}
                  aria-label={showVerifyPassword ? "Hide password" : "Show password"}
                >
                  {showVerifyPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.verify_password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.verify_password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.phone
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  id="company_name"
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => handleInputChange("company_name", e.target.value)}
                  placeholder="Your company name"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    errors.company_name
                      ? "border-red-400 bg-red-50 placeholder:text-red-400 focus:ring-red-500"
                      : "border-gray-300 bg-white placeholder:text-gray-400 focus:ring-blue-500"
                  }`}
                  disabled={loading}
                />
              </div>
              {errors.company_name && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.company_name}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center gap-2"
            >
              {loading && <Loader className="h-5 w-5 animate-spin" />}
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
