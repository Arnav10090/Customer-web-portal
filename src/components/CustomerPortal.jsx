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

const compareDriverHelperData = (data1, data2) => {
  return (
    data1.driverName === data2.driverName &&
    data1.driverPhone === data2.driverPhone &&
    data1.driverLanguage === data2.driverLanguage &&
    data1.helperName === data2.helperName &&
    data1.helperPhone === data2.helperPhone &&
    data1.helperLanguage === data2.helperLanguage
  );
};

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
  const [savedDriverHelperData, setSavedDriverHelperData] = useState(null);

  const docButtonRef = useRef(null);
  const docListRef = useRef(null);
  const vehicleButtonRef = useRef(null);
  const vehicleListRef = useRef(null);

  // Fetch user's vehicles on component mount - consolidated
  useEffect(() => {
    let isMounted = true; // Add cleanup flag

    const fetchMyVehicles = async () => {
      if (!user || !user.email) return;

      try {
        setLoadingVehicles(true);
        const response = await vehiclesAPI.getMyVehicles();
        if (isMounted) {
          setMyVehicles(response.data.vehicles || []);
          setVehicles(response.data.vehicles || []);
          setErrors((prev) => ({ ...prev, vehiclesFetch: null }));
        }
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
        if (isMounted) {
          if (error.response?.status === 401) {
            console.warn(
              "Got 401 when fetching vehicles - token may be invalid"
            );
            setVehicles([]);
          } else {
            setErrors((prev) => ({
              ...prev,
              vehiclesFetch:
                "Could not load your vehicles. You can still enter them manually.",
            }));
          }
        }
      } finally {
        if (isMounted) {
          setLoadingVehicles(false);
        }
      }
    };

    fetchMyVehicles();

    return () => {
      isMounted = false; // Cleanup
    };
  }, [user?.id]); // Only trigger when user ID changes

  // Handle vehicle selection from dropdown
const handleVehicleSelect = async (vehicleNumber) => {
  setVehicleDropdownOpen(false);
  setVehicleSearch("");
  setLoadingVehicleData(true);

  try {
    // Fetch complete vehicle data including driver, helper, PO, documents
    const response = await vehiclesAPI.getVehicleCompleteData(vehicleNumber);
    const { driver, helper, po_number, documents } = response.data;

    console.log("Vehicle data fetched:", response.data); // Debug log

    // Prepare updates object
    const updates = {
      vehicleNumber: vehicleNumber,
    };

    // Auto-fill PO number if available
    if (po_number) {
      updates.poNumber = po_number;
      showPopupMessage(`PO Number auto-filled: ${po_number}`, "info");
    }

    // Auto-fill driver data if available
    if (driver) {
      updates.driverName = driver.name || "";
      updates.driverPhone = driver.phoneNo || "";
      updates.driverLanguage = driver.language || "en";
      showPopupMessage(`Driver info auto-filled: ${driver.name}`, "info");
    }

    // Auto-fill helper data if available
    if (helper) {
      updates.helperName = helper.name || "";
      updates.helperPhone = helper.phoneNo || "";
      updates.helperLanguage = helper.language || "en";
      showPopupMessage(`Helper info auto-filled: ${helper.name}`, "info");
    }

    // Apply all updates at once
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));

    // Process and display documents
    if (documents && documents.length > 0) {
      console.log("Documents found:", documents); // Debug log

      // Map document types to frontend field names
      const docTypeMapping = {
        vehicle_registration: "vehicleRegistration",
        vehicle_insurance: "vehicleInsurance",
        vehicle_puc: "vehiclePuc",
        driver_aadhar: "driverAadhar",
        helper_aadhar: "helperAadhar",
        po: "po",
        do: "do",
        before_weighing: "beforeWeighing",
        after_weighing: "afterWeighing",
      };

      // Create file objects for each document
      const newFiles = { ...initialFiles };

      documents.forEach((doc) => {
        const frontendType = docTypeMapping[doc.type];
        if (frontendType) {
          // Create a file-like object with document info
          const fileObj = {
            name: doc.name || `${doc.type_display}.pdf`,
            documentId: doc.id,
            filePath: doc.filePath,
            type: "application/pdf", // Default type
            size: 0, // We don't have size from backend
            uploaded: true, // Mark as already uploaded
            fromDatabase: true, // Flag to indicate this is from database
          };

          // Add to the appropriate document type array
          if (!newFiles[frontendType]) {
            newFiles[frontendType] = [];
          }
          newFiles[frontendType] = [...newFiles[frontendType], fileObj];
        }
      });

      setFiles(newFiles);

      const docList = documents
        .map((d) => d.type_display || d.type)
        .join(", ");
      showPopupMessage(`Documents found: ${docList}`, "info");

      // Store documents info for display
      setAutoFillData({ driver, helper, po_number, documents });
    } else {
      console.log("No documents found for this vehicle"); // Debug log
      setAutoFillData({ driver, helper, po_number, documents: [] });
    }

    if (
      !driver &&
      !helper &&
      !po_number &&
      (!documents || documents.length === 0)
    ) {
      showPopupMessage(
        "No previous data found. Please enter manually.",
        "info"
      );
    }
  } catch (error) {
    console.error("Failed to load vehicle data:", error);
    showPopupMessage(
      "Could not load vehicle history. Please enter details manually.",
      "warning"
    );
  } finally {
    setLoadingVehicleData(false);
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

  // Replace your existing fetchVehicleData and autofillFormData with this:

// Fetch complete data for selected vehicle
const fetchVehicleData = async (vehicleRegNo) => {
  try {
    setLoadingVehicleData(true);
    const response = await vehiclesAPI.getVehicleCompleteData(vehicleRegNo);
    const data = response.data || {};

    // Save raw vehicleData for UI (used elsewhere)
    setVehicleData(data);

    // Auto-fill form data with fetched data (robust to response shapes)
    autofillFormData(data);

    // Also store autoFillData for documents / notifications
    const auto = {
      // tolerate either snake_case and camelCase, use fallback empty arrays/objects
      driver: data.driver || (Array.isArray(data.drivers) && data.drivers[0]) || null,
      helper: data.helper || (Array.isArray(data.helpers) && data.helpers[0]) || null,
      po_number: data.po_number || data.poNumber || "",
      documents: data.documents || data.document_list || [],
    };
    setAutoFillData(auto);
  } catch (error) {
    console.error("Failed to fetch vehicle data:", error);
    setVehicleData(null);
    setAutoFillData(null);
  } finally {
    setLoadingVehicleData(false);
  }
};

// Auto-fill form fields from fetched vehicle data
const autofillFormData = (data) => {
  if (!data) return;

  // Normalize fields (tolerate different shapes)
  const vehicleReg =
    (data.vehicle && data.vehicle.vehicleRegistrationNo) ||
    data.vehicleRegistrationNo ||
    "";

  const driver =
    data.driver || (Array.isArray(data.drivers) && data.drivers[0]) || null;

  const helper =
    data.helper || (Array.isArray(data.helpers) && data.helpers[0]) || null;

  const poNumber = data.po_number || data.poNumber || "";

  // Build updates to state
  const updates = {
    ...(vehicleReg ? { vehicleNumber: vehicleReg } : {}),
    ...(poNumber ? { poNumber: String(poNumber) } : {}),
  };

  if (driver) {
    updates.driverName = driver.name || driver.driverName || "";
    updates.driverPhone = driver.phoneNo || driver.driver_phone || "";
    updates.driverLanguage = driver.language || driver.lang || "en";
  }

  if (helper) {
    updates.helperName = helper.name || helper.helperName || "";
    updates.helperPhone = helper.phoneNo || helper.helper_phone || "";
    updates.helperLanguage = helper.language || helper.lang || "en";
  }

  // Apply updates in a single state update
  setFormData((prev) => ({
    ...prev,
    ...updates,
  }));

  // Decide what popup to show:
  // If user is on Step 0, show only the PO message (if present).
  // Otherwise show combined info (or nothing if nothing to show).
  if (currentStep === 0) {
    if (poNumber) {
      showPopupMessage(`PO Number auto-filled: ${poNumber}`, "info");
    } else {
      // optionally show nothing (keeps UI quiet). If you want fallback message, uncomment:
      // showPopupMessage("No PO number found for this vehicle", "info");
    }
    return; // don't show driver/helper messages when we're in step 0
  }

  // Not step 0: show a combined message (driver/helper/po)
  const parts = [];
  if (poNumber) parts.push(`PO: ${poNumber}`);
  if (driver && driver.name) parts.push(`Driver: ${driver.name}`);
  if (helper && helper.name) parts.push(`Helper: ${helper.name}`);

  if (parts.length > 0) {
    showPopupMessage(`Auto-filled — ${parts.join(" · ")}`, "info");
  }
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

  useEffect(() => {
    const onVehicleClickAway = (e) => {
      if (!vehicleButtonRef.current) return;
      if (vehicleButtonRef.current.contains(e.target)) return;
      if (
        vehicleListRef.current &&
        vehicleListRef.current.contains &&
        vehicleListRef.current.contains(e.target)
      )
        return;
      setVehicleDropdownOpen(false);
    };
    if (vehicleDropdownOpen) {
      document.addEventListener("click", onVehicleClickAway);
    }
    return () => document.removeEventListener("click", onVehicleClickAway);
  }, [vehicleDropdownOpen]);

  // Track changes to driver/helper fields to reset saved data
  useEffect(() => {
    if (savedDriverHelperData) {
      const currentData = {
        driverName: formData.driverName.trim(),
        driverPhone: formData.driverPhone,
        driverLanguage: formData.driverLanguage,
        helperName: formData.helperName.trim(),
        helperPhone: formData.helperPhone,
        helperLanguage: formData.helperLanguage,
      };

      // If data changed from saved version, clear savedDriverHelperData
      // so next time user clicks Continue, it will save again
      if (!compareDriverHelperData(currentData, savedDriverHelperData)) {
        setSavedDriverHelperData(null);
      }
    }
  }, [
    formData.driverName,
    formData.driverPhone,
    formData.driverLanguage,
    formData.helperName,
    formData.helperPhone,
    formData.helperLanguage,
    savedDriverHelperData,
  ]);

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
      formData.append("file", stagedFile);
      formData.append("document_type", selectedDocType);

      // Add reference fields based on what's available
      if (formData.vehicleNumber) {
        formData.append("vehicle_number", formData.vehicleNumber.trim());
      }
      if (formData.poNumber) {
        formData.append("po_number", formData.poNumber.trim());
      }
      if (formData.driverPhone) {
        formData.append("driver_phone", formData.driverPhone);
      }
      if (formData.helperPhone) {
        formData.append("helper_phone", formData.helperPhone);
      }

      // Call API to upload document
      const response = await documentsAPI.uploadToDocumentControl(formData);

      if (response.data && response.data.document) {
        // Success - document saved to local storage and database
        console.log("Document uploaded successfully:", response.data);

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
          `${
            documentOptions.find((d) => d.id === selectedDocType)?.label
          } uploaded successfully`,
          "info"
        );
      }
    } catch (error) {
      console.error("Upload error:", error);

      // Handle different error types
      let errorMessage = "Failed to upload document. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          errorMessage =
            data?.error || "Invalid file or missing reference information.";
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (status === 413) {
          errorMessage = "File is too large. Maximum size is 5MB.";
        } else if (data?.error) {
          errorMessage = data.error;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      setErrors((previous) => ({
        ...previous,
        staged: errorMessage,
      }));

      showPopupMessage(errorMessage, "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleClearUploaded = async (field, index = null) => {
    // Get the file to be deleted
    const fileToDelete = Array.isArray(files[field])
      ? files[field][index]
      : files[field];

    // Check if file has a documentId (meaning it was uploaded to database)
    if (fileToDelete?.documentId) {
      try {
        setLoading(true);

        // Call API to delete from DocumentControl table
        const response = await documentsAPI.deleteFromDocumentControl(
          fileToDelete.documentId
        );

        console.log("Document deleted from database:", response.data);

        showPopupMessage(
          response.data.message || "Document deleted successfully",
          "info"
        );
      } catch (error) {
        console.error("Failed to delete document:", error);

        // Show error but still remove from local state
        const errorMessage =
          error.response?.data?.error ||
          "Failed to delete document from database";
        showPopupMessage(errorMessage, "warning");
      } finally {
        setLoading(false);
      }
    }

    // Remove from local state
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
  const currentStepFields = stepFieldMap[currentStep];
  if (!validateFields(currentStepFields)) {
    showPopupMessage(
      "Please fill in all required fields before proceeding.",
      "warning"
    );
    return;
  }

  // If on step 0, save vehicle and call create-or-get API
  if (currentStep === 0 && !vehicleSaved) {
    try {
      setLoading(true);
      if (formData.vehicleNumber.trim()) {
        const response = await vehiclesAPI.createOrGetVehicle(formData.vehicleNumber);
        const { driver, helper } = response.data;
        
        // Auto-fill driver and helper for Step 2
        const updates = {};
        if (driver) {
          updates.driverName = driver.name || "";
          updates.driverPhone = driver.phoneNo || "";
          updates.driverLanguage = driver.language || "en";
          showPopupMessage(`Driver info auto-filled: ${driver.name}`, "info");
        }
        
        if (helper) {
          updates.helperName = helper.name || "";
          updates.helperPhone = helper.phoneNo || "";
          updates.helperLanguage = helper.language || "en";
          showPopupMessage(`Helper info auto-filled: ${helper.name}`, "info");
        }
        
        if (Object.keys(updates).length > 0) {
          setFormData((prev) => ({ ...prev, ...updates }));
        }
        
        setVehicleSaved(true);
      }
    } catch (error) {
      console.error("Failed to save vehicle:", error);
      showPopupMessage("Failed to save vehicle details, but you can continue", "warning");
    } finally {
      setLoading(false);
    }
  }

    // If on step 1, save driver and helper info ONLY if data has changed
    if (currentStep === 1) {
      // Create current data snapshot
      const currentDriverHelperData = {
        driverName: formData.driverName.trim(),
        driverPhone: formData.driverPhone,
        driverLanguage: formData.driverLanguage,
        helperName: formData.helperName.trim(),
        helperPhone: formData.helperPhone,
        helperLanguage: formData.helperLanguage,
      };

      // Check if data has changed since last save
      const hasChanged =
        !savedDriverHelperData ||
        !compareDriverHelperData(
          currentDriverHelperData,
          savedDriverHelperData
        );

      if (hasChanged) {
        try {
          setLoading(true);

          // Save driver info
          const driverPayload = {
            name: formData.driverName.trim(),
            phoneNo: formData.driverPhone,
            type: "Driver",
            language: formData.driverLanguage,
          };

          const driverResponse = await driversAPI.validateOrCreate(
            driverPayload
          );
          console.log("Driver saved:", driverResponse.data);

          // Save helper info
          const helperPayload = {
            name: formData.helperName.trim(),
            phoneNo: formData.helperPhone,
            type: "Helper",
            language: formData.helperLanguage,
          };

          const helperResponse = await driversAPI.validateOrCreate(
            helperPayload
          );
          console.log("Helper saved:", helperResponse.data);

          // Store the saved data to compare against future changes
          setSavedDriverHelperData(currentDriverHelperData);

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
      } else {
        console.log("Driver/helper data unchanged, skipping API call");
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
    // Preserve customer email and phone from logged-in user
    const customerEmail = user?.email || "";
    const customerPhone = user?.phone || user?.telephone || "";

    setFormData({
      ...initialFormData,
      customerEmail, // Keep customer email
      customerPhone, // Keep customer phone
    });
    setFiles(initialFiles);
    setErrors({});
    setSubmitError("");
    setCurrentStep(0);
    setSuccessData(null);
    setMockNotice("");
    setShowNotify(false);
    setVehicleSaved(false);
    setSavedDriverHelperData(null);

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

    // CRITICAL: Validate PO number before building payload
    if (!formData.poNumber || !formData.poNumber.trim()) {
      setSubmitError(
        "PO number is required. Please go back to Step 1 and enter it."
      );
      setCurrentStep(0);
      return;
    }

    // Check if at least ONE document is uploaded
    const hasAnyDocument = Object.values(files).some((fileData) => {
      if (Array.isArray(fileData)) {
        return fileData.length > 0;
      }
      return !!fileData;
    });

    if (!hasAnyDocument) {
      setCurrentStep(2);
      showPopupMessage("Please upload at least one document", "warning");
      setSubmitError("At least one document upload is required to submit.");
      return;
    }

    setLoading(true);
    setSubmitError("");
    setMockNotice("");

    try {
      // Build payload with ONLY form data (NO FILES)
      // Files are already uploaded to server via uploadToDocumentControl
      const payload = {
        customer_email: formData.customerEmail.trim(),
        customer_phone: formData.customerPhone,
        vehicle_number: formData.vehicleNumber.trim(),
        poNumber: formData.poNumber.trim(),
        driver_phone: formData.driverPhone,
        driver_name: formData.driverName.trim(),
        driver_language: formData.driverLanguage,
        helper_phone: formData.helperPhone,
        helper_name: formData.helperName.trim(),
        helper_language: formData.helperLanguage,
      };

      // Debug: Log what we're sending
      console.log("=== SUBMISSION DATA ===");
      console.log(JSON.stringify(payload, null, 2));
      console.log("======================");

      // Send JSON payload (not FormData since files are already uploaded)
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
      console.error("Error response:", error.response?.data);

      // Handle different error types
      let errorMessage = "Unable to submit entry. Please try again.";

      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        if (status === 400) {
          if (data?.error) {
            errorMessage = data.error;
          } else if (typeof data === "object") {
            const fieldErrors = Object.entries(data)
              .map(([field, errors]) => {
                const errorArray = Array.isArray(errors) ? errors : [errors];
                return `${field}: ${errorArray.join(", ")}`;
              })
              .join("\n");
            errorMessage = `Validation errors:\n${fieldErrors}`;
          }
        } else if (status === 401) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (data?.error || data?.message) {
          errorMessage = data.error || data.message;
        }
      } else if (error.request) {
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
                                type="button"
                                ref={vehicleButtonRef}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setVehicleDropdownOpen(!vehicleDropdownOpen);
                                }}
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
                                        type="button"
                                        key={vehicle.id}
                                        onClick={async (e) => {
                                          e.preventDefault();
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
                <>
                  {/* Auto-fill notification banner */}
                  {loadingVehicleData && (
                    <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Loading vehicle history for auto-fill...</span>
                    </div>
                  )}

                  {autoFillData && autoFillData.po_number && (
                    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold">
                          Auto-filled from previous submission:
                        </p>
                        <ul className="mt-1 list-disc list-inside">
                          <li>PO Number: {autoFillData.po_number}</li>
                          {autoFillData.driver && (
                            <li>Driver: {autoFillData.driver.name}</li>
                          )}
                          {autoFillData.helper && (
                            <li>Helper: {autoFillData.helper.name}</li>
                          )}
                        </ul>
                        <p className="mt-2 text-xs">
                          You can update any field if needed.
                        </p>
                      </div>
                    </div>
                  )}
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
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
                          Driver Phone no.
                          <span className="text-red-500"> *</span>
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{errors.driverPhone}</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="helperPhone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Helper Phone no.
                          <span className="text-red-500"> *</span>
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
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
                          Driver Language
                          <span className="text-red-500"> *</span>
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
                                          Math.min(
                                            prev + 1,
                                            filtered.length - 1
                                          )
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
                                        onMouseEnter={() =>
                                          setPrefHighlight(idx)
                                        }
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{errors.driverLanguage}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="helperLanguage"
                          className="text-sm font-medium text-gray-700"
                        >
                          Helper Language
                          <span className="text-red-500"> *</span>
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
                                          Math.min(
                                            prev + 1,
                                            filtered.length - 1
                                          )
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
                                        .includes(
                                          helperPrefSearch.toLowerCase()
                                        )
                                    )[helperPrefHighlight]?.value
                                  }
                                  tabIndex={-1}
                                  className="max-h-60 overflow-auto py-2"
                                >
                                  {languages
                                    .filter((l) =>
                                      l.label
                                        .toLowerCase()
                                        .includes(
                                          helperPrefSearch.toLowerCase()
                                        )
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
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            <span>{errors.helperLanguage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Show documents from database */}
                  {autoFillData &&
                    autoFillData.documents &&
                    autoFillData.documents.length > 0 && (
                      <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-green-800">
                              Previously uploaded documents:
                            </p>
                            <div className="mt-2 space-y-2">
                              {autoFillData.documents.map((doc, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-gray-900">
                                      {doc.type_display || doc.type}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      ({doc.name})
                                    </span>
                                  </div>
                                  <span className="text-xs text-green-600">
                                    ✓ Uploaded
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="mt-2 text-xs text-green-700">
                              These documents are already in the system. Upload
                              new documents below to add more or replace
                              existing ones.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
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
                                            if (n === filtered.length - 1)
                                              break;
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
                              No documents uploaded yet. Use the dropdown above
                              to select a type and upload a document.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </>
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
