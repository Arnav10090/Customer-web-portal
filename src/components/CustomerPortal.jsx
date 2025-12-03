import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Globe,
  LogOut,
  Loader,
  Phone,
  RefreshCw,
  Scan,
  Send,
  X,
  Truck,
  Upload,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  submissionsAPI,
  documentsAPI,
  driversAPI,
  vehiclesAPI,
  poDetailsAPI,
} from "../services/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const languages = [
  { value: "en", label: "English (en)" },
  { value: "hi", label: "Hindi - हिंदी (hi)" },
  { value: "ta", label: "Tamil - தமிழ் (ta)" },
  { value: "te", label: "Telugu - తెలుగు (te)" },
  { value: "kn", label: "Kannada - ಕನ್ನಡ (kn)" },
  { value: "ml", label: "Malayalam - മലയാളം (ml)" },
  { value: "mr", label: "Marathi - मराठी (mr)" },
  { value: "gu", label: "Gujarati - ગુજરાતી (gu)" },
  { value: "bn", label: "Bengali - বাংলা (bn)" },
  { value: "or", label: "Odia - ଓଡ଼ିଆ (or)" },
  { value: "pa", label: "Punjabi - ਪੰਜਾਬੀ (pa)" },
  { value: "as", label: "Assamese - অসমীয়া (as)" },
  { value: "ur", label: "Urdu - اردو (ur)" },
  { value: "sa", label: "Sanskrit - संस्कृत (sa)" },
  { value: "mai", label: "Maithili - मैथिली (mai)" },
];

const documentOptions = [
  { id: "vehicleRegistration", label: "Vehicle Registration" },
  { id: "vehicleInsurance", label: "Vehicle Insurance" },
  { id: "vehiclePuc", label: "Vehicle PUC" },
  { id: "driverAadhar", label: "Driver Aadhar Card" },
  { id: "helperAadhar", label: "Helper Aadhar Card" },
  { id: "po", label: "Purchase Order (PO)" },
  { id: "do", label: "Delivery Order (DO)" },
  { id: "beforeWeighing", label: "Before Weighing Receipt" },
  { id: "afterWeighing", label: "After Weighing Receipt" },
];

const steps = [
  {
    id: 0,
    title: "Vehicle Information",
    description: "Identify the vehicle entering the facility",
  },
  {
    id: 1,
    title: "Driver Information",
    description: "Capture driver contact preferences",
  },
  {
    id: 2,
    title: "Document Uploads",
    description: "Provide mandatory verification documents",
  },
];

const initialFormData = {
  vehicleNumber: "",
  poNumber: "",
  customerEmail: "",
  customerPhone: "",
  driverPhone: "",
  driverName: "",
  helperPhone: "",
  helperName: "",
  driverLanguage: "en",
  helperLanguage: "en",
};

const initialFiles = {
  purchaseOrder: [],
  vehiclePapers: [],
  aadhaarCard: [],
};

// Ensure initialFiles has keys for all dynamic document options
documentOptions.forEach((opt) => {
  if (!(opt.id in initialFiles)) {
    initialFiles[opt.id] = [];
  }
});

const validateVehicleNumber = (value) => {
  if (!value.trim()) {
    return "Vehicle number is required.";
  }
  if (value.trim().length < 2 || value.trim().length > 50) {
    return "Vehicle number must be between 2 and 50 characters.";
  }
  if (!/^[A-Z0-9-\s]+$/.test(value.trim())) {
    return "Use only uppercase letters, numbers, spaces, or hyphens.";
  }
  return "";
};

const validatePhone = (value, label) => {
  if (!value) {
    return `${label} is required.`;
  }
  if (!/^\+91\d{10}$/.test(value)) {
    return `${label} must follow +91XXXXXXXXXX format.`;
  }
  return "";
};

const validateEmail = (value) => {
  if (!value || !value.trim()) {
    return "Email is required.";
  }
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "Enter a valid email address.";
  }
  return "";
};

const validatePoNumber = (value) => {
  if (!value.trim()) {
    return "PO number is required.";
  }
  if (value.trim().length < 2 || value.trim().length > 50) {
    return "PO number must be between 2 and 50 characters.";
  }
  return "";
};

const validateHelperPhone = (value) => {
  if (!value) {
    return "Helper phone number is required.";
  }
  if (!/^\+91\d{10}$/.test(value)) {
    return "Helper phone must follow +91XXXXXXXXXX format.";
  }
  return "";
};

const validateFile = (file, label) => {
  if (!file) {
    return `${label} is required.`;
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${label} must be a PDF, JPG, JPEG, or PNG file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${label} must be 5MB or smaller.`;
  }
  return "";
};

const DocumentUploadField = ({
  id,
  label,
  description,
  file,
  onFileSelect,
  error,
}) => {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0];
    if (selected) {
      onFileSelect(id, selected);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      onFileSelect(id, dropped);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const triggerBrowse = (event) => {
    event.preventDefault();
    inputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
        <label
          htmlFor={`${id}-input`}
          className="text-sm font-semibold text-gray-800"
        >
          {label}
          <span className="text-red-500"> *</span>
        </label>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
      <div
        role="button"
        tabIndex={0}
        onClick={triggerBrowse}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            triggerBrowse(event);
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50 p-6 text-center transition-all duration-200 hover:border-blue-400 hover:bg-white focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          error ? "border-red-400 bg-red-50" : "border-gray-300"
        }`}
      >
        <Upload className="h-8 w-8 text-blue-500" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drag & drop or <span className="text-blue-600">browse files</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, JPG, JPEG, PNG up to 5MB
        </p>
        {file && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <CheckCircle
              className="h-5 w-5 text-green-500"
              aria-hidden="true"
            />
            <span
              className="text-sm font-medium text-green-700"
              title={file.name}
            >
              {file.name}
            </span>
          </div>
        )}
      </div>
      <input
        id={`${id}-input`}
        ref={inputRef}
        name={id}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const CustomerPortal = () => {
  const { logout, user } = useAuth();

  // Initialize from localStorage or use defaults
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = localStorage.getItem("customerPortal_currentStep");
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem("customerPortal_formData");
      return saved ? JSON.parse(saved) : initialFormData;
    } catch {
      return initialFormData;
    }
  });

  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem("customerPortal_files");
      return saved ? JSON.parse(saved) : initialFiles;
    } catch {
      return initialFiles;
    }
  });

  const [errors, setErrors] = useState({});
  const [selectedDocType, setSelectedDocType] = useState(documentOptions[0].id);
  const [stagedFile, setStagedFile] = useState(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [docHighlight, setDocHighlight] = useState(0);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Vehicle dropdown state
  const [vehicles, setVehicles] = useState([]);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicleData, setLoadingVehicleData] = useState(false);

  const [myVehicles, setMyVehicles] = useState([]);
  const [vehicleHighlight, setVehicleHighlight] = useState(0);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);

  const docButtonRef = useRef(null);
  const docListRef = useRef(null);
  const vehicleButtonRef = useRef(null);
  const vehicleListRef = useRef(null);

  // Fetch user's vehicles on component mount
  useEffect(() => {
    const fetchMyVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const response = await vehiclesAPI.getMyVehicles();
        setMyVehicles(response.data.vehicles || []);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoadingVehicles(false);
      }
    };

    if (user) {
      fetchMyVehicles();
    }
  }, [user]);

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = async (vehicleNumber) => {
    setFormData((prev) => ({ ...prev, vehicleNumber }));
    setVehicleDropdownOpen(false);

    // Trigger auto-fill
    try {
      const response = await vehiclesAPI.createOrGetVehicle(vehicleNumber);
      const { driver, helper, documents } = response.data;

      // Auto-fill driver data
      if (driver) {
        setFormData((prev) => ({
          ...prev,
          driverName: driver.name || "",
          driverPhone: driver.phoneNo || "",
          driverLanguage: driver.language || "en",
        }));
      }

      // Auto-fill helper data
      if (helper) {
        setFormData((prev) => ({
          ...prev,
          helperName: helper.name || "",
          helperPhone: helper.phoneNo || "",
          helperLanguage: helper.language || "en",
        }));
      }

      // Store documents data
      setAutoFillData({ driver, helper, documents });

      showPopupMessage("Vehicle data loaded successfully", "info");
    } catch (error) {
      console.error("Failed to load vehicle data:", error);
      showPopupMessage("Failed to load vehicle data", "warning");
    }
  };

  // Handle vehicle number blur (when user manually enters and tabs out)
  const handleVehicleNumberBlur = async () => {
    const vehicleNumber = formData.vehicleNumber.trim();
    if (!vehicleNumber || vehicleNumber.length < 4) return;

    // Check if this vehicle exists in my vehicles
    const exists = myVehicles.some(
      (v) => v.vehicleRegistrationNo === vehicleNumber
    );
    if (exists) {
      await handleVehicleSelect(vehicleNumber);
    } else {
      // Create new vehicle entry
      try {
        await vehiclesAPI.createOrGetVehicle(vehicleNumber);
        // Refresh my vehicles list
        const response = await vehiclesAPI.getMyVehicles();
        setMyVehicles(response.data.vehicles || []);
      } catch (error) {
        console.error("Failed to create vehicle:", error);
      }
    }
  };

  // Handle PO number blur
  const handlePONumberBlur = async () => {
    const poNumber = formData.poNumber.trim();
    if (!poNumber || poNumber.length < 2) return;

    try {
      await poDetailsAPI.createOrGetPO(poNumber);
    } catch (error) {
      console.error("Failed to save PO:", error);
    }
  };

  // Auto-populate customer details from logged-in user and reset on logout
  useEffect(() => {
    if (user && user.email && user.phone) {
      // User logged in - set only email and phone
      setFormData((prev) => ({
        ...prev,
        customerEmail: user.email,
        customerPhone: user.phone,
      }));
    } else if (!user) {
      // User logged out - reset entire form
      setFormData(initialFormData);
      setFiles(initialFiles);
      setErrors({});
      setCurrentStep(0);
      setSubmitError("");
      setSuccessData(null);
      setVehicles([]);
      setSelectedVehicle(null);
      setVehicleData(null);
    }
  }, [user?.id]); // Only trigger on user change, not on every render

  // Fetch user's vehicles - separate effect to avoid multiple calls
  useEffect(() => {
    if (user && user.email) {
      console.log("User logged in, checking token...");
      const token = localStorage.getItem("accessToken");
      console.log("Access token exists:", !!token);
      if (token) {
        console.log("Token first 20 chars:", token.substring(0, 20) + "...");
      }
      fetchUserVehicles();
    }
  }, [user?.id]); // Only trigger when user ID changes

  // Fetch user's vehicles from API
  const fetchUserVehicles = async () => {
    try {
      setLoadingVehicles(true);
      console.log("Fetching vehicles for user:", user?.email);
      const response = await vehiclesAPI.getMyVehicles();
      console.log("Vehicles fetched successfully:", response.data);
      setVehicles(response.data.vehicles || []);
      setErrors((prev) => ({ ...prev, vehiclesFetch: null }));
    } catch (error) {
      console.error(
        "Failed to fetch vehicles:",
        error.response || error.message
      );
      // If it's a 401, it means token issue, but user is logged in so just show empty
      if (error.response?.status === 401) {
        console.warn("Got 401 when fetching vehicles - token may be invalid");
        setVehicles([]);
        // Token might be expired, no need to show error
      } else {
        console.error("Error details:", error.response?.data);
        setErrors((prev) => ({
          ...prev,
          vehiclesFetch:
            "Could not load your vehicles. You can still enter them manually.",
        }));
      }
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Fetch complete data for selected vehicle
  const fetchVehicleData = async (vehicleRegNo) => {
    try {
      setLoadingVehicleData(true);
      const response = await vehiclesAPI.getVehicleCompleteData(vehicleRegNo);
      setVehicleData(response.data);

      // Auto-fill form data with fetched data
      autofillFormData(response.data);
    } catch (error) {
      console.error("Failed to fetch vehicle data:", error);
      setVehicleData(null);
    } finally {
      setLoadingVehicleData(false);
    }
  };

  // Auto-fill form fields from fetched vehicle data
  const autofillFormData = (data) => {
    const updates = {
      vehicleNumber: data.vehicle.vehicleRegistrationNo,
    };

    // Auto-fill driver info if available
    if (data.drivers && data.drivers.length > 0) {
      const driver = data.drivers[0];
      updates.driverName = driver.name;
      updates.driverPhone = driver.phoneNo;
      updates.driverLanguage = driver.language;
    }

    // Auto-fill helper info if available
    if (data.helpers && data.helpers.length > 0) {
      const helper = data.helpers[0];
      updates.helperName = helper.name;
      updates.helperPhone = helper.phoneNo;
      updates.helperLanguage = helper.language;
    }

    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Save formData to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("customerPortal_formData", JSON.stringify(formData));
    } catch (error) {
      console.error("Failed to save form data to localStorage:", error);
    }
  }, [formData]);

  // Save files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("customerPortal_files", JSON.stringify(files));
    } catch (error) {
      console.error("Failed to save files to localStorage:", error);
    }
  }, [files]);

  // Save currentStep to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        "customerPortal_currentStep",
        currentStep.toString()
      );
    } catch (error) {
      console.error("Failed to save current step to localStorage:", error);
    }
  }, [currentStep]);

  // click-away to close dropdown
  useEffect(() => {
    const onDocClickAway = (e) => {
      if (!docButtonRef.current) return;
      if (docButtonRef.current.contains(e.target)) return;
      if (
        docListRef.current &&
        docListRef.current.contains &&
        docListRef.current.contains(e.target)
      )
        return;
      setDocDropdownOpen(false);
    };
    if (docDropdownOpen) {
      document.addEventListener("click", onDocClickAway);
    }
    return () => document.removeEventListener("click", onDocClickAway);
  }, [docDropdownOpen]);
  // preferred language custom dropdown state
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);
  const [prefSearch, setPrefSearch] = useState("");
  const [prefHighlight, setPrefHighlight] = useState(0);
  const prefButtonRef = useRef(null);
  const prefListRef = useRef(null);

  // helper preferred language dropdown state (for helper language)
  const [helperPrefDropdownOpen, setHelperPrefDropdownOpen] = useState(false);
  const [helperPrefSearch, setHelperPrefSearch] = useState("");
  const [helperPrefHighlight, setHelperPrefHighlight] = useState(0);
  const helperPrefButtonRef = useRef(null);
  const helperPrefListRef = useRef(null);

  // click-away to close preferred language dropdown
  useEffect(() => {
    const onPrefClickAway = (e) => {
      if (!prefButtonRef.current) return;
      if (prefButtonRef.current.contains(e.target)) return;
      if (
        prefListRef.current &&
        prefListRef.current.contains &&
        prefListRef.current.contains(e.target)
      )
        return;
      setPrefDropdownOpen(false);
    };
    if (prefDropdownOpen) {
      document.addEventListener("click", onPrefClickAway);
    }
    return () => document.removeEventListener("click", onPrefClickAway);
  }, [prefDropdownOpen]);

  // click-away to close helper language dropdown
  useEffect(() => {
    const onHelperPrefClickAway = (e) => {
      if (!helperPrefButtonRef.current) return;
      if (helperPrefButtonRef.current.contains(e.target)) return;
      if (
        helperPrefListRef.current &&
        helperPrefListRef.current.contains &&
        helperPrefListRef.current.contains(e.target)
      )
        return;
      setHelperPrefDropdownOpen(false);
    };
    if (helperPrefDropdownOpen) {
      document.addEventListener("click", onHelperPrefClickAway);
    }
    return () => document.removeEventListener("click", onHelperPrefClickAway);
  }, [helperPrefDropdownOpen]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [mockNotice, setMockNotice] = useState("");
  const [showNotify, setShowNotify] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVariant, setPopupVariant] = useState("info");

  const stepFieldMap = useMemo(
    () => ({
      0: ["customerEmail", "customerPhone", "vehicleNumber", "poNumber"],
      1: [
        "driverPhone",
        "helperPhone",
        "driverLanguage",
        "helperName",
        "driverName",
        "helperLanguage",
      ],
      // step 2 requires at least one document upload; use a special token
      2: ["_anyDocument"],
    }),
    []
  );

  const formatVehicleNumber = (value) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9-\s]/g, "")
      .slice(0, 50);

  const formatPhoneValue = (value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      return "";
    }
    const withoutCountry = digits.startsWith("91") ? digits.slice(2) : digits;
    const trimmed = withoutCountry.slice(0, 10);
    return trimmed ? `+91${trimmed}` : "";
  };

  const clearFieldError = useCallback((field) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }
      const updated = { ...previous };
      delete updated[field];
      return updated;
    });
  }, []);

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      logout();
    } finally {
      setLogoutLoading(false);
    }
  }, [logout]);

  const handleInputChange = (field, value) => {
    let nextValue = value;
    if (field === "vehicleNumber") {
      nextValue = formatVehicleNumber(value);
      setVehicleSaved(false);
    }
    if (
      field === "driverPhone" ||
      field === "helperPhone" ||
      field === "customerPhone"
    ) {
      nextValue = formatPhoneValue(value);
    }
    if (field === "poNumber") {
      nextValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9-\s]/g, "")
        .slice(0, 50);
    }
    setFormData((previous) => ({
      ...previous,
      [field]: nextValue,
    }));
    clearFieldError(field);
  };

  const handleFileSelect = (field, file) => {
    // Append file to the array for the selected type
    // Validate file quickly
    let errorMessage = "";
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errorMessage = "Only PDF, JPG, JPEG, or PNG files are accepted.";
    } else if (file.size > MAX_FILE_SIZE) {
      errorMessage = "File must be 5MB or smaller.";
    }
    if (errorMessage) {
      setErrors((previous) => ({
        ...previous,
        [field]: errorMessage,
      }));
      return;
    }
    setFiles((previous) => {
      const existing = previous[field];
      const arr = Array.isArray(existing)
        ? existing
        : existing
        ? [existing]
        : [];
      return {
        ...previous,
        [field]: [...arr, file],
      };
    });
    clearFieldError(field);
  };

  const handleStageFile = (file) => {
    // validate quickly
    let errorMessage = "";
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errorMessage = "Only PDF, JPG, JPEG, or PNG files are accepted.";
    } else if (file.size > MAX_FILE_SIZE) {
      errorMessage = "File must be 5MB or smaller.";
    }
    if (errorMessage) {
      setErrors((previous) => ({ ...previous, staged: errorMessage }));
      return;
    }
    setStagedFile(file);
    setErrors((previous) => {
      const copy = { ...previous };
      delete copy.staged;
      return copy;
    });
  };

  const handleUploadStaged = async () => {
  if (!stagedFile) {
    setErrors((previous) => ({
      ...previous,
      staged: "No file selected to upload.",
    }));
    return;
  }

  // Show loading state
  setLoading(true);
  
  try {
    // Prepare FormData for API call
    const formData = new FormData();
    formData.append('file', stagedFile);
    formData.append('document_type', selectedDocType);
    
    // Add reference fields based on what's available
    if (formData.vehicleNumber) {
      formData.append('vehicle_number', formData.vehicleNumber.trim());
    }
    if (formData.poNumber) {
      formData.append('po_number', formData.poNumber.trim());
    }
    if (formData.driverPhone) {
      formData.append('driver_phone', formData.driverPhone);
    }
    if (formData.helperPhone) {
      formData.append('helper_phone', formData.helperPhone);
    }

    // Call API to upload document
    const response = await documentsAPI.uploadToDocumentControl(formData);
    
    if (response.data && response.data.document) {
      // Success - document saved to local storage and database
      console.log('Document uploaded successfully:', response.data);
      
      // Store file info in local state (for display purposes)
      setFiles((previous) => {
        const existing = previous[selectedDocType];
        const arr = Array.isArray(existing)
          ? existing
          : existing
          ? [existing]
          : [];
        
        // Store file object with database info
        const fileWithInfo = {
          ...stagedFile,
          documentId: response.data.document.id,
          filePath: response.data.document.filePath,
          name: stagedFile.name,
        };
        
        return {
          ...previous,
          [selectedDocType]: [...arr, fileWithInfo],
        };
      });
      
      // Clear staged file
      setStagedFile(null);
      clearFieldError(selectedDocType);
      
      // Show success message
      showPopupMessage(
        `${documentOptions.find(d => d.id === selectedDocType)?.label} uploaded successfully`,
        'info'
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle different error types
    let errorMessage = 'Failed to upload document. Please try again.';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 400) {
        errorMessage = data?.error || 'Invalid file or missing reference information.';
      } else if (status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.';
      } else if (status === 413) {
        errorMessage = 'File is too large. Maximum size is 5MB.';
      } else if (data?.error) {
        errorMessage = data.error;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection.';
    }
    
    setErrors((previous) => ({
      ...previous,
      staged: errorMessage,
    }));
    
    showPopupMessage(errorMessage, 'warning');
  } finally {
    setLoading(false);
  }
};

  const handleClearUploaded = (field, index = null) => {
    setFiles((previous) => {
      const copy = { ...previous };
      if (!Array.isArray(copy[field])) return copy;
      if (index === null) {
        // clear all
        copy[field] = [];
      } else {
        copy[field] = copy[field].filter((_, i) => i !== index);
      }
      return copy;
    });
    clearFieldError(field);
  };

  const validateFields = useCallback(
    (fieldsToValidate) => {
      const validationErrors = {};
      fieldsToValidate.forEach((field) => {
        if (field === "customerPhone") {
          const result = validatePhone(
            formData.customerPhone,
            "Customer phone number"
          );
          if (result) {
            validationErrors.customerPhone = result;
          }
        }
        if (field === "customerEmail") {
          const result = validateEmail(formData.customerEmail);
          if (result) {
            validationErrors.customerEmail = result;
          }
        }
        if (field === "vehicleNumber") {
          const result = validateVehicleNumber(formData.vehicleNumber);
          if (result) {
            validationErrors.vehicleNumber = result;
          }
        }
        if (field === "poNumber") {
          const result = validatePoNumber(formData.poNumber);
          if (result) {
            validationErrors.poNumber = result;
          }
        }
        if (field === "driverPhone") {
          const result = validatePhone(
            formData.driverPhone,
            "Driver phone number"
          );
          if (result) {
            validationErrors.driverPhone = result;
          }
        }
        if (field === "driverName") {
          if (!formData.driverName || !formData.driverName.trim()) {
            validationErrors.driverName = "Driver name is required.";
          } else if (formData.driverName.trim().length < 2) {
            validationErrors.driverName =
              "Driver name must be at least 2 characters.";
          }
        }
        if (field === "helperPhone") {
          const result = validateHelperPhone(formData.helperPhone);
          if (result) {
            validationErrors.helperPhone = result;
          }
        }
        if (field === "helperName") {
          if (!formData.helperName || !formData.helperName.trim()) {
            validationErrors.helperName = "Helper name is required.";
          } else if (formData.helperName.trim().length < 2) {
            validationErrors.helperName =
              "Helper name must be at least 2 characters.";
          }
        }
        if (field === "driverLanguage" && !formData.driverLanguage) {
          validationErrors.driverLanguage = "Driver language is required.";
        }
        if (field === "helperLanguage" && !formData.helperLanguage) {
          validationErrors.helperLanguage = "Helper language is required.";
        }
        if (field === "purchaseOrder") {
          const first = (files.purchaseOrder && files.purchaseOrder[0]) || null;
          const result = validateFile(first, "Purchase Order");
          if (result) {
            validationErrors.purchaseOrder = result;
          }
        }
        if (field === "vehiclePapers") {
          const first = (files.vehiclePapers && files.vehiclePapers[0]) || null;
          const result = validateFile(first, "Vehicle Papers");
          if (result) {
            validationErrors.vehiclePapers = result;
          }
        }
        if (field === "aadhaarCard") {
          const first = (files.aadhaarCard && files.aadhaarCard[0]) || null;
          const result = validateFile(first, "Driver Aadhaar Card");
          if (result) {
            validationErrors.aadhaarCard = result;
          }
        }
        if (field === "_anyDocument") {
          const anyUploaded = Object.values(files).some((arr) =>
            Array.isArray(arr) ? arr.length > 0 : !!arr
          );
          if (!anyUploaded) {
            validationErrors.documents =
              "At least one document upload is required.";
          }
        }
      });
      setErrors((previous) => ({ ...previous, ...validationErrors }));
      return Object.keys(validationErrors).length === 0;
    },
    [files, formData]
  );

  const handleNextStep = async () => {
    // Validate current step fields before moving to next step
    const currentStepFields = stepFieldMap[currentStep];
    if (!validateFields(currentStepFields)) {
      showPopupMessage(
        "Please fill in all required fields before proceeding.",
        "warning"
      );
      return;
    }

    // If on step 0, save vehicle before continuing (only if not already saved)
    if (currentStep === 0 && !vehicleSaved) {
      try {
        // Save vehicle number
        if (formData.vehicleNumber.trim()) {
          await vehiclesAPI.createOrGetVehicle(formData.vehicleNumber);
          setVehicleSaved(true);
          showPopupMessage("Vehicle details saved successfully", "info");
        }
      } catch (error) {
        console.error("Failed to save vehicle:", error);
        showPopupMessage(
          "Failed to save vehicle details, but you can continue",
          "warning"
        );
      }
    }

    // If on step 1, save driver and helper info
    if (currentStep === 1) {
      try {
        setLoading(true);

        // Save driver info
        const driverPayload = {
          name: formData.driverName.trim(),
          phoneNo: formData.driverPhone,
          type: "Driver",
          language: formData.driverLanguage,
        };

        const driverResponse = await driversAPI.validateOrCreate(driverPayload);
        console.log("Driver saved:", driverResponse.data);

        // Save helper info
        const helperPayload = {
          name: formData.helperName.trim(),
          phoneNo: formData.helperPhone,
          type: "Helper",
          language: formData.helperLanguage,
        };

        const helperResponse = await driversAPI.validateOrCreate(helperPayload);
        console.log("Helper saved:", helperResponse.data);

        showPopupMessage(
          "Driver and helper information saved successfully",
          "info"
        );
      } catch (error) {
        console.error("Failed to save driver/helper:", error);
        showPopupMessage(
          error.response?.data?.error ||
            "Failed to save driver/helper information",
          "warning"
        );
        return; // Don't proceed if save fails
      } finally {
        setLoading(false);
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const validateAll = useCallback(() => {
    const allFields = Object.values(stepFieldMap).flat();
    return validateFields(allFields);
  }, [stepFieldMap, validateFields]);

  const resetForm = () => {
    setFormData(initialFormData);
    setFiles(initialFiles);
    setErrors({});
    setSubmitError("");
    setCurrentStep(0);
    setSuccessData(null);
    setMockNotice("");
    setShowNotify(false);
    setVehicleSaved(false);

    // Clear localStorage
    localStorage.removeItem("customerPortal_formData");
    localStorage.removeItem("customerPortal_files");
    localStorage.removeItem("customerPortal_currentStep");
  };

  // Auto-dismiss notification when shown
  useEffect(() => {
    if (showNotify) {
      const id = setTimeout(() => setShowNotify(false), 8000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [showNotify]);

  // Auto-dismiss generic popup
  useEffect(() => {
    if (showPopup) {
      const id = setTimeout(() => setShowPopup(false), 5000);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [showPopup]);

  const showPopupMessage = (message, variant = "info") => {
    setPopupMessage(message);
    setPopupVariant(variant);
    setShowPopup(true);
  };

  const makeDemoQr = (vehicleNumber, driverPhone) => {
    const payload = {
      type: "ENTRY_QR_DEMO",
      vehicleNumber,
      driverPhone,
      ts: Date.now(),
    };
    const data = encodeURIComponent(JSON.stringify(payload));
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
  };

  const handleDownloadQr = async () => {
    if (!successData?.qrCodeImage) {
      return;
    }
    const sanitizedVehicle = (successData.vehicleNumber || "vehicle").replace(
      /[^A-Z0-9-]+/gi,
      "-"
    );
    const filename = `entry-qr-${sanitizedVehicle}.png`;

    try {
      const imageSrc = successData.qrCodeImage;

      // Data URLs can be downloaded directly
      if (imageSrc.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // For cross-origin URLs, fetch the image as a blob and create an object URL
      const response = await fetch(imageSrc);
      if (!response.ok) {
        throw new Error("Failed to fetch QR image for download.");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSubmitError(
        "Unable to download QR code. Please try opening the image in a new tab."
      );
    }
  };

  const handleSubmit = async () => {
    // Validate all fields before submission
    if (!validateAll()) {
      setSubmitError("Please fix the highlighted errors before submitting.");
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        const targetStep = Object.entries(stepFieldMap).find(
          ([stepId, fields]) =>
            fields.some((f) => errorKeys.includes(f) || f === "_anyDocument")
        )?.[0];
        if (typeof targetStep !== "undefined") {
          setCurrentStep(Number(targetStep));
        }
      }
      return;
    }

    // Check for missing documents
    const missingDocs = documentOptions.filter((d) => !files[d.id]);
    if (missingDocs.length > 0) {
      setCurrentStep(2);

      if (missingDocs.length === 1) {
        showPopupMessage(`${missingDocs[0].label} was not uploaded`, "warning");
      } else if (missingDocs.length === 2) {
        showPopupMessage(
          `${missingDocs[0].label} and ${missingDocs[1].label} were not uploaded`,
          "warning"
        );
      } else {
        const firstTwo = missingDocs
          .slice(0, 2)
          .map((d) => d.label)
          .join(", ");
        const remaining = missingDocs.length - 2;
        showPopupMessage(
          `${firstTwo} and ${remaining} other document${
            remaining > 1 ? "s" : ""
          } were not uploaded`,
          "warning"
        );
      }

      setSubmitError("Please upload all required documents before submitting.");
      return;
    }

    setLoading(true);
    setSubmitError("");
    setMockNotice("");

    // Build FormData with snake_case field names for Django backend
    const payload = new FormData();

    // Customer information
    if (formData.customerEmail) {
      payload.append("customer_email", formData.customerEmail.trim());
    }
    if (formData.customerPhone) {
      payload.append("customer_phone", formData.customerPhone);
    }

    // Vehicle and PO information
    payload.append("vehicle_number", formData.vehicleNumber.trim());
    if (formData.poNumber) {
      payload.append("po_number", formData.poNumber.trim());
    }

    // Driver information
    payload.append("driver_phone", formData.driverPhone);
    if (formData.driverName) {
      payload.append("driver_name", formData.driverName.trim());
    }
    payload.append("driver_language", formData.driverLanguage);

    // Helper information
    if (formData.helperPhone) {
      payload.append("helper_phone", formData.helperPhone);
    }
    if (formData.helperName) {
      payload.append("helper_name", formData.helperName.trim());
    }
    if (formData.helperLanguage) {
      payload.append("helper_language", formData.helperLanguage);
    }

    // Append document files
    Object.entries(files).forEach(([key, arrOrFile]) => {
      if (!arrOrFile) return;

      if (Array.isArray(arrOrFile)) {
        arrOrFile.forEach((file) => payload.append(key, file));
      } else {
        payload.append(key, arrOrFile);
      }
    });

    try {
      // Use the submissionsAPI service instead of fetch
      const response = await submissionsAPI.createSubmission(payload);

      // Extract submission data from response
      const submission = response.data?.submission || response.data;

      if (!submission?.qrCodeImage && !submission?.qr_code_image) {
        throw new Error(
          "Submission succeeded but QR code is unavailable. Contact support."
        );
      }

      // Set success data (handle both camelCase and snake_case from backend)
      setSuccessData({
        qrCodeImage: submission.qrCodeImage || submission.qr_code_image,
        vehicleNumber:
          submission.vehicleNumber ||
          submission.vehicle_number ||
          formData.vehicleNumber.trim(),
        driverPhone:
          submission.driverPhone ||
          submission.driver_phone ||
          formData.driverPhone,
      });

      // Clear localStorage after successful submission
      localStorage.removeItem("customerPortal_formData");
      localStorage.removeItem("customerPortal_files");
      localStorage.removeItem("customerPortal_currentStep");

      setShowNotify(true);
      setMockNotice("");
      setSubmitError("");
    } catch (error) {
      console.error("Submission error:", error);

      // Handle different error types
      let errorMessage = "Unable to submit entry. Please try again.";

      if (error.response) {
        // Backend returned an error response
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          // Validation errors
          errorMessage =
            data?.error ||
            data?.message ||
            "Invalid data provided. Please check your inputs.";
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please sign in again.";
          // The interceptor will handle token refresh automatically
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (data?.error || data?.message) {
          errorMessage = data.error || data.message;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage =
          "Network error. Please check your connection and try again.";
      }

      setSubmitError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        {/* Toast notification */}
        {showNotify && (
          <div className="fixed right-6 top-6 z-50 w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle
                  className="h-5 w-5 text-green-600"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  QR code link emailed
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  QR code link emailed on{" "}
                  <span className="font-medium text-gray-900">
                    {formData.customerEmail || "—"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  and your mobile number:{" "}
                  <span className="font-medium text-gray-900">
                    {formData.customerPhone || "—"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotify(false)}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {/* Generic popup (for warnings/info) */}
        {showPopup && (
          <div className="fixed right-6 top-28 z-50 w-full max-w-sm rounded-xl bg-white shadow-lg">
            <div
              className={`flex items-start gap-3 p-4 ${
                popupVariant === "warning"
                  ? "border-l-4 border-yellow-400"
                  : "border-l-4 border-blue-400"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                <FileText className="h-5 w-5 text-gray-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {popupMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Scan className="h-7 w-7 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Entry QR Code Generated
                </h1>
                <p className="text-sm text-gray-500">
                  Share this QR code with the driver for gate access.
                </p>
              </div>
            </div>
            {mockNotice && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
                <span>{mockNotice}</span>
              </div>
            )}
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <img
                  src={successData.qrCodeImage}
                  alt="Driver entry QR code"
                  className="h-60 w-60 rounded-xl border border-gray-200 bg-white object-contain p-4"
                />
                <div className="mt-4 space-y-1 text-center">
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {successData.vehicleNumber}
                  </p>
                  <p className="text-sm text-gray-500">Driver Phone</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {successData.driverPhone}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className="mt-0.5 h-5 w-5 text-green-500"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-gray-700">
                      The driver must present this QR code at the gate entrance.
                      A token number will be sent to the driver's phone upon
                      scanning.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 text-blue-500"
                      aria-hidden="true"
                    />
                    <p className="text-sm text-gray-700">
                      Keep a digital and printed copy handy to avoid delays at
                      the security checkpoint.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download QR Code
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500 px-5 py-3 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Submit Another Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
      {/* Toast notification */}
      {showNotify && (
        <div className="fixed right-6 top-6 z-50 w-full max-w-sm rounded-xl bg-white shadow-xl">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle
                className="h-5 w-5 text-green-600"
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                QR code link emailed
              </p>
              <p className="mt-1 text-sm text-gray-600">
                QR code link emailed on{" "}
                <span className="font-medium text-gray-900">
                  {formData.customerEmail || "—"}
                </span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Your mobile number:{" "}
                <span className="font-medium text-gray-900">
                  {formData.customerPhone || "—"}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNotify(false)}
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {/* Generic popup (for warnings/info) */}
      {showPopup && (
        <div className="fixed right-6 top-28 z-50 w-full max-w-sm rounded-xl bg-white shadow-lg">
          <div
            className={`flex items-start gap-3 p-4 ${
              popupVariant === "warning"
                ? "border-l-4 border-yellow-400"
                : "border-l-4 border-blue-400"
            }`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
              <FileText className="h-5 w-5 text-gray-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {popupMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPopup(false)}
              className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Truck className="h-7 w-7 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Customer Gate Entry Portal
                  </h1>
                  <p className="text-sm text-gray-500">
                    Submit driver details and documents to generate a secure
                    entry QR code.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-col sm:flex-row">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                >
                  {logoutLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  {logoutLoading ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </header>

            <nav className="grid gap-3 sm:grid-cols-3">
              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl border px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? "border-blue-500 bg-blue-50"
                        : isCompleted
                        ? "border-green-400 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Step {step.id + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </nav>

            <form className="space-y-8">
              {currentStep === 0 && (
                <>
                  <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <div className="flex items-center gap-3">
                      <User
                        className="h-5 w-5 text-blue-600"
                        aria-hidden="true"
                      />
                      <h2 className="text-lg font-semibold text-gray-800">
                        Customer Details
                      </h2>
                    </div>
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div>
                        <label
                          htmlFor="customerEmail"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email ID<span className="text-red-500"> *</span>
                        </label>
                        <input
                          id="customerEmail"
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          readOnly
                          placeholder="you@example.com"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-not-allowed bg-gray-100 ${
                            errors.customerEmail
                              ? "border-red-400 bg-red-50 placeholder:text-red-400"
                              : "border-gray-300"
                          }`}
                          autoComplete="email"
                        />
                        {errors.customerEmail && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{errors.customerEmail}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="customerPhone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Phone Number<span className="text-red-500"> *</span>
                        </label>
                        <input
                          id="customerPhone"
                          name="customerPhone"
                          type="tel"
                          inputMode="numeric"
                          value={formData.customerPhone}
                          readOnly
                          placeholder="+91XXXXXXXXXX"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-not-allowed bg-gray-100 ${
                            errors.customerPhone
                              ? "border-red-400 bg-red-50 placeholder:text-red-400"
                              : "border-gray-300"
                          }`}
                        />
                        {errors.customerPhone && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{errors.customerPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-3">
                        <Truck
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold text-gray-800">
                          Vehicle Information
                        </h2>
                      </div>
                      <div className="mt-6 grid gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700">
                            Select Vehicle (Optional)
                          </label>
                          {loadingVehicles ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Loading your vehicles...</span>
                            </div>
                          ) : vehicles.length === 0 ? (
                            <p className="mt-2 text-sm text-gray-500">
                              No previously registered vehicles found. Enter
                              vehicle details below.
                            </p>
                          ) : (
                            <div className="relative mt-2">
                              <button
                                ref={vehicleButtonRef}
                                onClick={() =>
                                  setVehicleDropdownOpen(!vehicleDropdownOpen)
                                }
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-left font-medium text-gray-900 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-between"
                              >
                                <span>
                                  {selectedVehicle
                                    ? selectedVehicle.vehicleRegistrationNo
                                    : "Select a vehicle..."}
                                </span>
                                <ChevronDown className="h-4 w-4" />
                              </button>

                              {vehicleDropdownOpen && vehicles.length > 0 && (
                                <div
                                  ref={vehicleListRef}
                                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                                >
                                  <div className="p-2 sticky top-0 bg-white border-b">
                                    <input
                                      type="text"
                                      placeholder="Search vehicle..."
                                      value={vehicleSearch}
                                      onChange={(e) =>
                                        setVehicleSearch(e.target.value)
                                      }
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                  {vehicles
                                    .filter((v) =>
                                      v.vehicleRegistrationNo
                                        .toLowerCase()
                                        .includes(vehicleSearch.toLowerCase())
                                    )
                                    .map((vehicle) => (
                                      <button
                                        key={vehicle.id}
                                        onClick={async () => {
                                          setSelectedVehicle(vehicle);
                                          setVehicleDropdownOpen(false);
                                          setVehicleSearch("");
                                          await fetchVehicleData(
                                            vehicle.vehicleRegistrationNo
                                          );
                                        }}
                                        disabled={loadingVehicleData}
                                        className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                      >
                                        {vehicle.vehicleRegistrationNo}
                                        {vehicle.remark && (
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({vehicle.remark})
                                          </span>
                                        )}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          )}
                          {loadingVehicleData && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Loading vehicle data...</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="vehicleNumber"
                            className="text-sm font-medium text-gray-700"
                          >
                            Vehicle Number
                            <span className="text-red-500"> *</span>
                          </label>
                          <input
                            id="vehicleNumber"
                            name="vehicleNumber"
                            type="text"
                            value={formData.vehicleNumber}
                            onChange={(event) =>
                              handleInputChange(
                                "vehicleNumber",
                                event.target.value
                              )
                            }
                            placeholder="Enter vehicle number"
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              errors.vehicleNumber
                                ? "border-red-400 bg-red-50 placeholder:text-red-400"
                                : "border-gray-300 bg-white"
                            }`}
                            autoComplete="off"
                          />

                          {errors.vehicleNumber && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{errors.vehicleNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-3">
                        <FileText
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold text-gray-800">
                          PO Details
                        </h2>
                      </div>
                      <div className="mt-6 grid gap-6">
                        <div>
                          <label
                            htmlFor="poNumber"
                            className="text-sm font-medium text-gray-700"
                          >
                            PO Number<span className="text-red-500"> *</span>
                          </label>
                          <input
                            id="poNumber"
                            name="poNumber"
                            type="text"
                            value={formData.poNumber}
                            onChange={(event) =>
                              handleInputChange("poNumber", event.target.value)
                            }
                            placeholder="Enter PO number"
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              errors.poNumber
                                ? "border-red-400 bg-red-50 placeholder:text-red-400"
                                : "border-gray-300 bg-white"
                            }`}
                            autoComplete="off"
                          />
                          {errors.poNumber && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{errors.poNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {currentStep === 1 && (
                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <Phone
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Driver Information
                    </h2>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Row 1: Names */}
                    <div>
                      <label
                        htmlFor="driverName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Driver name<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="driverName"
                        name="driverName"
                        type="text"
                        value={formData.driverName}
                        onChange={(e) =>
                          handleInputChange("driverName", e.target.value)
                        }
                        placeholder="Driver name"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.driverName
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white"
                        }`}
                        autoComplete="name"
                      />
                      {errors.driverName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.driverName}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="helperName"
                        className="text-sm font-medium text-gray-700"
                      >
                        Helper name<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="helperName"
                        name="helperName"
                        type="text"
                        value={formData.helperName}
                        onChange={(e) =>
                          handleInputChange("helperName", e.target.value)
                        }
                        placeholder="Helper name"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.helperName
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white"
                        }`}
                        autoComplete="name"
                      />
                      {errors.helperName && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.helperName}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Phones */}
                    <div>
                      <label
                        htmlFor="driverPhone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Driver Phone no.<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="driverPhone"
                        name="driverPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.driverPhone}
                        onChange={(e) =>
                          handleInputChange("driverPhone", e.target.value)
                        }
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.driverPhone
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white"
                        }`}
                      />
                      {errors.driverPhone && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.driverPhone}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="helperPhone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Helper Phone no.<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="helperPhone"
                        name="helperPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.helperPhone}
                        onChange={(e) =>
                          handleInputChange("helperPhone", e.target.value)
                        }
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.helperPhone
                            ? "border-red-400 bg-red-50"
                            : "border-gray-300 bg-white"
                        }`}
                      />
                      {errors.helperPhone && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.helperPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Row 3: Languages */}
                    <div>
                      <label
                        htmlFor="driverLanguage"
                        className="text-sm font-medium text-gray-700"
                      >
                        Driver Language<span className="text-red-500"> *</span>
                      </label>
                      <div className="relative mt-2">
                        <Globe
                          className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <div className="relative max-w-md">
                          <button
                            ref={prefButtonRef}
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={prefDropdownOpen}
                            onClick={() => {
                              setPrefDropdownOpen((s) => !s);
                              setPrefHighlight(
                                languages.findIndex(
                                  (l) => l.value === formData.driverLanguage
                                )
                              );
                            }}
                            className={`w-full rounded-xl border ${
                              errors.driverLanguage
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300"
                            } bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>
                                {
                                  languages.find(
                                    (l) => l.value === formData.driverLanguage
                                  )?.label
                                }
                              </span>
                              <svg
                                className={`ml-auto h-4 w-4 text-gray-500 transform ${
                                  prefDropdownOpen ? "rotate-180" : "rotate-0"
                                }`}
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                              >
                                <path
                                  d="M6 8l4 4 4-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>
                          {prefDropdownOpen && (
                            <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg">
                              <div className="p-2">
                                <input
                                  ref={prefListRef}
                                  type="text"
                                  value={prefSearch}
                                  onChange={(e) => {
                                    setPrefSearch(e.target.value);
                                    setPrefHighlight(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      const filtered = languages.filter((l) =>
                                        l.label
                                          .toLowerCase()
                                          .includes(prefSearch.toLowerCase())
                                      );
                                      setPrefHighlight((prev) =>
                                        Math.min(prev + 1, filtered.length - 1)
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setPrefHighlight((prev) =>
                                        Math.max(prev - 1, 0)
                                      );
                                    } else if (e.key === "Enter") {
                                      e.preventDefault();
                                      const filtered = languages.filter((l) =>
                                        l.label
                                          .toLowerCase()
                                          .includes(prefSearch.toLowerCase())
                                      );
                                      if (filtered[prefHighlight]) {
                                        handleInputChange(
                                          "driverLanguage",
                                          filtered[prefHighlight].value
                                        );
                                        setPrefDropdownOpen(false);
                                        setPrefSearch("");
                                      }
                                    }
                                  }}
                                  placeholder="Search languages..."
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <ul
                                role="listbox"
                                aria-activedescendant={
                                  languages.filter((l) =>
                                    l.label
                                      .toLowerCase()
                                      .includes(prefSearch.toLowerCase())
                                  )[prefHighlight]?.value
                                }
                                tabIndex={-1}
                                className="max-h-60 overflow-auto py-2"
                              >
                                {languages
                                  .filter((l) =>
                                    l.label
                                      .toLowerCase()
                                      .includes(prefSearch.toLowerCase())
                                  )
                                  .map((opt, idx) => (
                                    <li
                                      key={opt.value}
                                      role="option"
                                      aria-selected={
                                        formData.driverLanguage === opt.value
                                      }
                                      onClick={() => {
                                        handleInputChange(
                                          "driverLanguage",
                                          opt.value
                                        );
                                        setPrefDropdownOpen(false);
                                        setPrefSearch("");
                                      }}
                                      onMouseEnter={() => setPrefHighlight(idx)}
                                      className={`cursor-pointer px-4 py-2 text-sm ${
                                        formData.driverLanguage === opt.value
                                          ? "bg-blue-50 text-blue-700 font-semibold"
                                          : prefHighlight === idx
                                          ? "bg-gray-100"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {opt.label}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.driverLanguage && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.driverLanguage}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="helperLanguage"
                        className="text-sm font-medium text-gray-700"
                      >
                        Helper Language<span className="text-red-500"> *</span>
                      </label>
                      <div className="relative mt-2">
                        <Globe
                          className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <div className="relative max-w-md">
                          <button
                            ref={helperPrefButtonRef}
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={helperPrefDropdownOpen}
                            onClick={() => {
                              setHelperPrefDropdownOpen((s) => !s);
                              setHelperPrefHighlight(
                                languages.findIndex(
                                  (l) => l.value === formData.helperLanguage
                                )
                              );
                            }}
                            className={`w-full rounded-xl border ${
                              errors.helperLanguage
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300"
                            } bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>
                                {
                                  languages.find(
                                    (l) => l.value === formData.helperLanguage
                                  )?.label
                                }
                              </span>
                              <svg
                                className={`ml-auto h-4 w-4 text-gray-500 transform ${
                                  helperPrefDropdownOpen
                                    ? "rotate-180"
                                    : "rotate-0"
                                }`}
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                              >
                                <path
                                  d="M6 8l4 4 4-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>
                          {helperPrefDropdownOpen && (
                            <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg">
                              <div className="p-2">
                                <input
                                  ref={helperPrefListRef}
                                  type="text"
                                  value={helperPrefSearch}
                                  onChange={(e) => {
                                    setHelperPrefSearch(e.target.value);
                                    setHelperPrefHighlight(0);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      const filtered = languages.filter((l) =>
                                        l.label
                                          .toLowerCase()
                                          .includes(
                                            helperPrefSearch.toLowerCase()
                                          )
                                      );
                                      setHelperPrefHighlight((prev) =>
                                        Math.min(prev + 1, filtered.length - 1)
                                      );
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setHelperPrefHighlight((prev) =>
                                        Math.max(prev - 1, 0)
                                      );
                                    } else if (e.key === "Enter") {
                                      e.preventDefault();
                                      const filtered = languages.filter((l) =>
                                        l.label
                                          .toLowerCase()
                                          .includes(
                                            helperPrefSearch.toLowerCase()
                                          )
                                      );
                                      if (filtered[helperPrefHighlight]) {
                                        handleInputChange(
                                          "helperLanguage",
                                          filtered[helperPrefHighlight].value
                                        );
                                        setHelperPrefDropdownOpen(false);
                                        setHelperPrefSearch("");
                                      }
                                    }
                                  }}
                                  placeholder="Search languages..."
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <ul
                                role="listbox"
                                aria-activedescendant={
                                  languages.filter((l) =>
                                    l.label
                                      .toLowerCase()
                                      .includes(helperPrefSearch.toLowerCase())
                                  )[helperPrefHighlight]?.value
                                }
                                tabIndex={-1}
                                className="max-h-60 overflow-auto py-2"
                              >
                                {languages
                                  .filter((l) =>
                                    l.label
                                      .toLowerCase()
                                      .includes(helperPrefSearch.toLowerCase())
                                  )
                                  .map((opt, idx) => (
                                    <li
                                      key={opt.value}
                                      role="option"
                                      aria-selected={
                                        formData.helperLanguage === opt.value
                                      }
                                      onClick={() => {
                                        handleInputChange(
                                          "helperLanguage",
                                          opt.value
                                        );
                                        setHelperPrefDropdownOpen(false);
                                        setHelperPrefSearch("");
                                      }}
                                      onMouseEnter={() =>
                                        setHelperPrefHighlight(idx)
                                      }
                                      className={`cursor-pointer px-4 py-2 text-sm ${
                                        formData.helperLanguage === opt.value
                                          ? "bg-blue-50 text-blue-700 font-semibold"
                                          : helperPrefHighlight === idx
                                          ? "bg-gray-100"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {opt.label}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      {errors.helperLanguage && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.helperLanguage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 2 && (
                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <FileText
                      className="h-5 w-5 text-blue-600"
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold text-gray-800">
                      Document Uploads
                    </h2>
                  </div>
                  <div className="mt-6 grid gap-6">
                    <div className="grid gap-3">
                      <label
                        htmlFor="docType"
                        className="text-sm font-medium text-gray-700"
                      >
                        Select Document Type to Upload
                      </label>
                      <div className="relative mt-2 w-full max-w-md">
                        <div className="relative">
                          <button
                            ref={docButtonRef}
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={docDropdownOpen}
                            onClick={() => {
                              setDocDropdownOpen((s) => {
                                const next = !s;
                                if (next) {
                                  const init = documentOptions.map((o) => ({
                                    ...o,
                                    disabled: !!files[o.id],
                                  }));
                                  const first = init.findIndex(
                                    (f) => !f.disabled
                                  );
                                  setDocHighlight(first >= 0 ? first : 0);
                                  setDocSearch("");
                                }
                                return next;
                              });
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === "ArrowDown" ||
                                e.key === "Enter" ||
                                e.key === " "
                              ) {
                                e.preventDefault();
                                setDocDropdownOpen(true);
                                setTimeout(
                                  () => docListRef.current?.focus?.(),
                                  0
                                );
                              }
                            }}
                            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <div className="flex items-center justify-between">
                              <span>
                                {
                                  documentOptions.find(
                                    (d) => d.id === selectedDocType
                                  )?.label
                                }
                              </span>
                              <svg
                                className={`h-4 w-4 text-gray-500 transform transition-transform ${
                                  docDropdownOpen ? "rotate-180" : "rotate-0"
                                }`}
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden
                              >
                                <path
                                  d="M6 8l4 4 4-4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </div>
                          </button>

                          {docDropdownOpen && (
                            <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg">
                              <div className="p-2">
                                <input
                                  ref={docListRef}
                                  type="text"
                                  value={docSearch}
                                  onChange={(e) => {
                                    setDocSearch(e.target.value);
                                    // reset highlight to first non-disabled match
                                    const filteredInit = documentOptions
                                      .filter((o) =>
                                        o.label
                                          .toLowerCase()
                                          .includes(
                                            e.target.value.toLowerCase()
                                          )
                                      )
                                      .map((o) => ({
                                        ...o,
                                        disabled: !!files[o.id],
                                      }));
                                    const first = filteredInit.findIndex(
                                      (f) => !f.disabled
                                    );
                                    setDocHighlight(first >= 0 ? first : 0);
                                  }}
                                  onKeyDown={(e) => {
                                    const filtered = documentOptions
                                      .filter((o) =>
                                        o.label
                                          .toLowerCase()
                                          .includes(docSearch.toLowerCase())
                                      )
                                      .map((o) => ({
                                        ...o,
                                        disabled: !!files[o.id],
                                      }));
                                    if (e.key === "ArrowDown") {
                                      e.preventDefault();
                                      // move to next non-disabled
                                      setDocHighlight((h) => {
                                        let n = h;
                                        for (
                                          let i = 0;
                                          i < filtered.length;
                                          i++
                                        ) {
                                          n = Math.min(
                                            n + 1,
                                            filtered.length - 1
                                          );
                                          if (!filtered[n].disabled) return n;
                                          if (n === filtered.length - 1) break;
                                        }
                                        return h;
                                      });
                                    } else if (e.key === "ArrowUp") {
                                      e.preventDefault();
                                      setDocHighlight((h) => {
                                        let n = h;
                                        for (
                                          let i = 0;
                                          i < filtered.length;
                                          i++
                                        ) {
                                          n = Math.max(n - 1, 0);
                                          if (!filtered[n].disabled) return n;
                                          if (n === 0) break;
                                        }
                                        return h;
                                      });
                                    } else if (e.key === "Enter") {
                                      e.preventDefault();
                                      const pick = documentOptions
                                        .filter((o) =>
                                          o.label
                                            .toLowerCase()
                                            .includes(docSearch.toLowerCase())
                                        )
                                        .map((o) => ({
                                          ...o,
                                          disabled: !!files[o.id],
                                        }))[docHighlight];
                                      if (pick && !pick.disabled) {
                                        setSelectedDocType(pick.id);
                                        setDocDropdownOpen(false);
                                      }
                                    } else if (e.key === "Escape") {
                                      setDocDropdownOpen(false);
                                    }
                                  }}
                                  placeholder="Search documents..."
                                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <ul
                                role="listbox"
                                aria-activedescendant={
                                  documentOptions[docHighlight]?.id
                                }
                                tabIndex={-1}
                                className="max-h-60 overflow-auto py-2"
                              >
                                {documentOptions
                                  .filter((o) =>
                                    o.label
                                      .toLowerCase()
                                      .includes(docSearch.toLowerCase())
                                  )
                                  .map((opt, idx) => {
                                    const disabled = !!files[opt.id];
                                    return (
                                      <li
                                        key={opt.id}
                                        id={opt.id}
                                        role="option"
                                        aria-selected={
                                          selectedDocType === opt.id
                                        }
                                        aria-disabled={disabled}
                                        onClick={() => {
                                          setSelectedDocType(opt.id);
                                          setDocDropdownOpen(false);
                                        }}
                                        onMouseEnter={() =>
                                          setDocHighlight(idx)
                                        }
                                        className={`px-4 py-2 text-sm cursor-pointer ${
                                          selectedDocType === opt.id
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : docHighlight === idx
                                            ? "bg-gray-100"
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {opt.label}
                                      </li>
                                    );
                                  })}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-start gap-4">
                        <div
                          role="button"
                          tabIndex={0}
                          onDrop={(e) => {
                            e.preventDefault();
                            const f = e.dataTransfer.files?.[0];
                            if (f) handleStageFile(f);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onClick={() =>
                            document
                              .getElementById("staged-file-input")
                              ?.click()
                          }
                          className={`flex-1 cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all duration-150 ${
                            errors.staged
                              ? "border-red-400 bg-red-50"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-700">
                            {stagedFile
                              ? stagedFile.name
                              : "Drag & drop a file here or click to browse"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            PDF, JPG, JPEG, PNG up to 5MB
                          </p>
                          <input
                            id="staged-file-input"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const s = e.target.files?.[0];
                              if (s) handleStageFile(s);
                            }}
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={handleUploadStaged}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            Upload
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setStagedFile(null);
                              setErrors((p) => {
                                const c = { ...p };
                                delete c.staged;
                                return c;
                              });
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {errors.staged && (
                        <div className="mt-2 text-sm text-red-600">
                          {errors.staged}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <p className="text-sm font-medium text-gray-700">
                        Uploaded Documents
                      </p>
                      <div className="grid gap-3">
                        {errors.documents && (
                          <div className="text-sm text-red-600">
                            {errors.documents}
                          </div>
                        )}
                        {documentOptions.map((opt) => {
                          const arr = files[opt.id] || [];
                          if (!Array.isArray(arr) || arr.length === 0)
                            return null;
                          return arr.map((file, idx) => (
                            <div
                              key={`${opt.id}-${idx}`}
                              className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-800">
                                    {opt.label}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {file.name}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleClearUploaded(opt.id, idx)
                                  }
                                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          ));
                        })}

                        {Object.values(files).every(
                          (arr) => !Array.isArray(arr) || arr.length === 0
                        ) && (
                          <div className="rounded-md border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                            No documents uploaded yet. Use the dropdown above to
                            select a type and upload a document.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </form>

            {submitError && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    currentStep === 0
                      ? "cursor-not-allowed border-gray-200 text-gray-400"
                      : "border-blue-500 text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  Back
                </button>
                {currentStep < steps.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    Continue
                  </button>
                )}
              </div>

              {currentStep === steps.length - 1 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-hidden="true"
                      />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" aria-hidden="true" />
                      Submit Entry
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortal;
