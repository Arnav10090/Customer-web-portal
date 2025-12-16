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
import DriverHelperModal from "./DriverHelperModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const compareDriverHelperData = (data1, data2) => {
  if (!data1 || !data2) return false;

  return (
    (data1.driverName || "") === (data2.driverName || "") &&
    (data1.driverPhone || "") === (data2.driverPhone || "") &&
    (data1.driverLanguage || "en") === (data2.driverLanguage || "en") &&
    (data1.driverAadhar || "") === (data2.driverAadhar || "") &&
    (data1.helperName || "") === (data2.helperName || "") &&
    (data1.helperPhone || "") === (data2.helperPhone || "") &&
    (data1.helperLanguage || "en") === (data2.helperLanguage || "en") &&
    (data1.helperAadhar || "") === (data2.helperAadhar || "")
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
  driverAadhar: "",
  helperPhone: "",
  helperName: "",
  helperAadhar: "",
  driverLanguage: "en",
  helperLanguage: "en",
  vehicleRatings: "",
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

  const trimmed = value.trim().toUpperCase();

  // Remove all spaces and hyphens for validation
  const cleaned = trimmed.replace(/[\s-]/g, "");

  // Format 1: Standard format - SS NN XX NNNN (e.g., MH 12 AB 1234)
  const standardFormat = /^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/;

  // Format 2: Temporary registration - YY MM TEMP NNNN (e.g., 23 12 TEMP 5567)
  const tempFormat = /^\d{2}\d{2}TEMP\d{4}$/;

  // Format 3: Special vehicles - CC/CD/UN followed by 4 digits
  const specialFormat = /^(CC|CD|UN)\d{4}$/;

  // Format 4: Army vehicles - ↑ 12C 34567 (using upward arrow or similar)
  const armyFormat = /^[↑△▲]\d{2}[A-Z]\d{5}$/;

  // Format 5: Bharat Series - YY BH #### XX (e.g., 22 BH 4589 AA)
  const bharatFormat = /^\d{2}BH\d{4}[A-Z]{2}$/;

  // Format 6: Two-wheeler - XX VA NNNN or Four-wheeler - XX VA NNNNN
  const vaFormat = /^[A-Z]{2}VA\d{4,5}$/;

  const isValid =
    standardFormat.test(cleaned) ||
    tempFormat.test(cleaned) ||
    specialFormat.test(cleaned) ||
    armyFormat.test(cleaned) ||
    bharatFormat.test(cleaned) ||
    vaFormat.test(cleaned);

  if (!isValid) {
    return "Invalid vehicle number format";
  }

  if (trimmed.length < 4 || trimmed.length > 20) {
    return "Vehicle number must be between 4 and 20 characters.";
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
  if (!value || typeof value !== "string" || !value.trim()) {
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

const validateAadhar = (value, label) => {
  if (!value || !value.trim()) {
    return `${label} is required.`;
  }
  // Aadhar is 12 digits
  if (!/^\d{12}$/.test(value.trim())) {
    return `${label} must be exactly 12 digits.`;
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
  const [vehicleRatings, setVehicleRatings] = useState("");

  // PO dropdown state
  const [poNumbers, setPoNumbers] = useState([]);
  const [poDropdownOpen, setPoDropdownOpen] = useState(false);
  const [poSearch, setPoSearch] = useState(() => {
    try {
      const saved = localStorage.getItem("customerPortal_formData");
      if (saved) {
        const parsed = JSON.parse(saved);
        return String(parsed.poNumber || "");
      }
    } catch {
      // ignore
    }
    return "";
  });
  const [loadingPos, setLoadingPos] = useState(false);
  const [driverExists, setDriverExists] = useState(false);
  const [helperExists, setHelperExists] = useState(false);
  const [hasShownDriverHelperPopup, setHasShownDriverHelperPopup] =
    useState(false);

  const [myVehicles, setMyVehicles] = useState([]);
  const [vehicleHighlight, setVehicleHighlight] = useState(0);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [savedDriverHelperData, setSavedDriverHelperData] = useState(null);

  const [savedDriverData, setSavedDriverData] = useState(null);
  const [savedHelperData, setSavedHelperData] = useState(null);
  const [driverChanged, setDriverChanged] = useState(false);
  const [helperChanged, setHelperChanged] = useState(false);
  const [savingDriver, setSavingDriver] = useState(false);
  const [savingHelper, setSavingHelper] = useState(false);

  const docButtonRef = useRef(null);
  const docListRef = useRef(null);
  const vehicleButtonRef = useRef(null);
  const vehicleInputRef = useRef(null);
  const vehicleListRef = useRef(null);
  const poInputRef = useRef(null);
  const poListRef = useRef(null);

  const normalizeAadharValue = (value) =>
    String(value ?? "")
      .replace(/\D/g, "")
      .slice(0, 12);

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

  // Fetch user's PO numbers on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchMyPOs = async () => {
      if (!user || !user.email) return;

      try {
        setLoadingPos(true);
        const response = await poDetailsAPI.getMyPOs();
        if (isMounted) {
          const poList = response.data.pos || [];
          setPoNumbers(poList);
          setErrors((prev) => ({ ...prev, poFetch: null }));
        }
      } catch (error) {
        console.error("Failed to fetch PO numbers:", error);
        if (isMounted) {
          if (error.response?.status === 401) {
            console.warn(
              "Got 401 when fetching PO numbers - token may be invalid"
            );
            setPoNumbers([]);
          } else {
            setErrors((prev) => ({
              ...prev,
              poFetch:
                "Could not load your PO numbers. You can still enter them manually.",
            }));
          }
        }
      } finally {
        if (isMounted) {
          setLoadingPos(false);
        }
      }
    };

    fetchMyPOs();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    console.log("=== PO Debug ===");
    console.log("poSearch type:", typeof poSearch);
    console.log("poSearch value:", poSearch);
    console.log("formData.poNumber:", formData.poNumber);
    console.log("poNumbers:", poNumbers);
  }, [poSearch, formData.poNumber, poNumbers]);

  // Sync poSearch with formData.poNumber - with type safety
  useEffect(() => {
    const poNumber = String(formData.poNumber || "");
    const currentSearch = String(poSearch || "");

    if (poNumber && poNumber !== currentSearch) {
      setPoSearch(poNumber);
    }
  }, [formData.poNumber]);

  // Handle vehicle selection from dropdown
  const handleVehicleSelect = async (vehicleNumber) => {
    setVehicleDropdownOpen(false);
    setVehicleSearch("");
    setLoadingVehicleData(true);

    try {
      // First get vehicle ID
      const vehicleResponse = await vehiclesAPI.createOrGetVehicle(
        vehicleNumber
      );
      const vehicleId = vehicleResponse.data.vehicle.id;

      // Fetch ALL drivers/helpers for this vehicle
      const driverHelperResponse = await driversAPI.getByVehicle(vehicleId);
      const { drivers = [], helpers = [] } = driverHelperResponse.data;

      // Store all drivers and helpers for dropdowns
      setAllDrivers(drivers);
      setAllHelpers(helpers);

      // Auto-fill with most recent driver/helper (first in list)
      const updates = {
        vehicleNumber: vehicleNumber,
      };

      if (drivers.length > 0) {
        const driver = drivers[0];
        updates.driverName = driver.name || "";
        updates.driverPhone = driver.phoneNo || "";
        updates.driverLanguage = driver.language || "en";
        updates.driverAadhar = normalizeAadharValue(driver.uid);
        setSavedDriverData(driver);
        setDriverExists(!!driver.uid);
      }

      if (helpers.length > 0) {
        const helper = helpers[0];
        updates.helperName = helper.name || "";
        updates.helperPhone = helper.phoneNo || "";
        updates.helperLanguage = helper.language || "en";
        updates.helperAadhar = normalizeAadharValue(helper.uid);
        setSavedHelperData(helper);
        setHelperExists(!!helper.uid);
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      // Fetch complete vehicle data for documents
      const completeDataResponse = await vehiclesAPI.getVehicleCompleteData(
        vehicleNumber
      );
      const { documents, po_number } = completeDataResponse.data;

      // Only update PO number if user hasn't already selected one
      if (po_number) {
        setFormData((prev) => {
          const existing =
            typeof prev.poNumber === "string"
              ? prev.poNumber.trim()
              : String(prev.poNumber || "").trim();
          if (existing) return prev;
          return {
            ...prev,
            poNumber: String(po_number),
          };
        });
      }

      if (documents && documents.length > 0) {
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

        const newFiles = { ...initialFiles };

        documents.forEach((doc) => {
          const frontendType = docTypeMapping[doc.type];
          if (frontendType) {
            const fileObj = {
              name: doc.name || `${doc.type_display}.pdf`,
              documentId: doc.id,
              filePath: doc.filePath,
              type: "application/pdf",
              size: 0,
              uploaded: true,
              fromDatabase: true,
            };

            if (!newFiles[frontendType]) {
              newFiles[frontendType] = [];
            }
            newFiles[frontendType] = [...newFiles[frontendType], fileObj];
          }
        });

        setFiles(newFiles);
      }

      if (drivers.length > 0 || helpers.length > 0) {
        showPopupMessage(
          `Vehicle data loaded${drivers.length > 0 ? " with driver(s)" : ""}${
            helpers.length > 0 ? " and helper(s)" : ""
          } info`,
          "info"
        );
      }
    } catch (error) {
      console.error("Failed to load vehicle data:", error);
      showPopupMessage("Failed to load vehicle data", "warning");
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

  // Handle PO number blur (accept optional PO value to avoid state race)
  const handlePONumberBlur = async (poNumberArg) => {
    const poNumber = poNumberArg
      ? String(poNumberArg).trim()
      : formData.poNumber && typeof formData.poNumber === "string"
      ? formData.poNumber.trim()
      : "";
    if (!poNumber || poNumber.length < 2) return;

    try {
      setLoadingDap(true);
      const response = await poDetailsAPI.createOrGetPO(poNumber);
      const poData = response.data.po;

      // Extract dapName - it could be an ID or an object with properties
      if (poData && poData.dapName) {
        // If dapName is an object with zone name
        if (typeof poData.dapName === "object" && poData.dapName.name) {
          setDapName(poData.dapName.name);
        } else if (typeof poData.dapName === "string") {
          // If it's just a string ID, we might need to fetch zone details
          setDapName(poData.dapName);
        }
      } else {
        setDapName("");
      }
    } catch (error) {
      console.error("Failed to fetch PO details:", error);
      setDapName("");
    } finally {
      setLoadingDap(false);
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

      console.log("Vehicle Complete Data Response:", data);
      console.log("Drivers from API:", data.drivers);

      // Save raw vehicleData for UI
      setVehicleData(data);

      // Store ALL drivers and helpers for dropdowns
      const allDriversList = data.drivers || [];
      const allHelpersList = data.helpers || [];

      console.log("Setting allDrivers with count:", allDriversList.length);
      console.log(
        "Driver names:",
        allDriversList.map((d) => d.name)
      );

      setAllDrivers(allDriversList);
      setAllHelpers(allHelpersList);

      // Auto-fill with most recent driver/helper (first in list)
      const updates = {
        vehicleNumber: vehicleRegNo,
      };

      if (allDriversList.length > 0) {
        const driver = allDriversList[0];
        updates.driverName = driver.name || "";
        updates.driverPhone = driver.phoneNo || "";
        updates.driverLanguage = driver.language || "en";
        updates.driverAadhar = normalizeAadharValue(driver.uid);
        setSavedDriverData(driver);
        setDriverExists(!!driver.uid);
      }

      if (allHelpersList.length > 0) {
        const helper = allHelpersList[0];
        updates.helperName = helper.name || "";
        updates.helperPhone = helper.phoneNo || "";
        updates.helperLanguage = helper.language || "en";
        updates.helperAadhar = normalizeAadharValue(helper.uid);
        setSavedHelperData(helper);
        setHelperExists(!!helper.uid);
      }

      setFormData((prev) => ({
        ...prev,
        ...updates,
      }));

      // Handle PO number
      const poNumber = data.po_number || data.poNumber || "";
      if (poNumber) {
        const poNumberStr = String(poNumber);
        setFormData((prev) => {
          const existing =
            typeof prev.poNumber === "string"
              ? prev.poNumber.trim()
              : String(prev.poNumber || "").trim();
          if (existing) return prev;
          return {
            ...prev,
            poNumber: poNumberStr,
          };
        });
      }

      // Handle documents
      const documents = data.documents || data.document_list || [];
      if (documents.length > 0) {
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

        const newFiles = { ...initialFiles };

        documents.forEach((doc) => {
          const frontendType = docTypeMapping[doc.type];
          if (frontendType) {
            const fileObj = {
              name: doc.name || `${doc.type_display}.pdf`,
              documentId: doc.id,
              filePath: doc.filePath,
              type: "application/pdf",
              size: 0,
              uploaded: true,
              fromDatabase: true,
            };

            if (!newFiles[frontendType]) {
              newFiles[frontendType] = [];
            }
            newFiles[frontendType] = [...newFiles[frontendType], fileObj];
          }
        });

        setFiles(newFiles);
      }

      // Store autoFillData for notifications
      const auto = {
        drivers: allDriversList,
        helpers: allHelpersList,
        po_number: poNumber,
        documents: documents,
      };
      setAutoFillData(auto);

      if (allDriversList.length > 0 || allHelpersList.length > 0) {
        showPopupMessage(
          `Vehicle data loaded with ${allDriversList.length} driver(s) and ${allHelpersList.length} helper(s)`,
          "info"
        );
      }
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

    const ratings = data.ratings || data.vehicleRatings || data.rating || "";

    // Build updates to state
    const updates = {
      ...(vehicleReg ? { vehicleNumber: vehicleReg } : {}),
      ...(poNumber ? { poNumber: String(poNumber) } : {}),
      ...(ratings ? { vehicleRatings: String(ratings) } : {}),
    };

    if (driver) {
      updates.driverName = driver.name || driver.driverName || "";
      updates.driverPhone = driver.phoneNo || driver.driver_phone || "";
      updates.driverLanguage = driver.language || driver.lang || "en";
      updates.driverAadhar = normalizeAadharValue(driver.uid);
      setDriverExists(!!driver.uid);
    }

    if (helper) {
      updates.helperName = helper.name || helper.helperName || "";
      updates.helperPhone = helper.phoneNo || helper.helper_phone || "";
      updates.helperLanguage = helper.language || helper.lang || "en";
      updates.helperAadhar = normalizeAadharValue(helper.uid);
      setHelperExists(!!helper.uid);
    }

    // Apply updates in a single state update
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
  // Modal states
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showHelperModal, setShowHelperModal] = useState(false);

  // Driver/Helper dropdown states
  const [allDrivers, setAllDrivers] = useState([]);
  const [allHelpers, setAllHelpers] = useState([]);
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [helperDropdownOpen, setHelperDropdownOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [helperSearch, setHelperSearch] = useState("");
  const driverInputRef = useRef(null);
  const helperInputRef = useRef(null);
  const driverListRef2 = useRef(null);
  const helperListRef2 = useRef(null);

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

  // Click-away for driver dropdown
  useEffect(() => {
    const onDriverClickAway = (e) => {
      if (driverInputRef.current && driverInputRef.current.contains(e.target)) {
        return;
      }
      if (driverListRef2.current && driverListRef2.current.contains(e.target))
        return;
      setDriverDropdownOpen(false);
    };
    if (driverDropdownOpen) {
      document.addEventListener("click", onDriverClickAway);
    }
    return () => document.removeEventListener("click", onDriverClickAway);
  }, [driverDropdownOpen]);

  // Click-away for helper dropdown
  useEffect(() => {
    const onHelperClickAway = (e) => {
      if (helperInputRef.current && helperInputRef.current.contains(e.target)) {
        return;
      }
      if (helperListRef2.current && helperListRef2.current.contains(e.target))
        return;
      setHelperDropdownOpen(false);
    };
    if (helperDropdownOpen) {
      document.addEventListener("click", onHelperClickAway);
    }
    return () => document.removeEventListener("click", onHelperClickAway);
  }, [helperDropdownOpen]);

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
      if (
        vehicleInputRef.current &&
        vehicleInputRef.current.contains(e.target)
      ) {
        return;
      }
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

  // Handle clicking outside PO dropdown to close it
  useEffect(() => {
    const onPoClickAway = (e) => {
      if (poInputRef.current && poInputRef.current.contains(e.target)) {
        return;
      }
      if (
        poListRef.current &&
        poListRef.current.contains &&
        poListRef.current.contains(e.target)
      )
        return;
      setPoDropdownOpen(false);
    };
    if (poDropdownOpen) {
      document.addEventListener("click", onPoClickAway);
    }
    return () => document.removeEventListener("click", onPoClickAway);
  }, [poDropdownOpen]);

  // Track changes to driver/helper fields to reset saved data
  useEffect(() => {
    if (savedDriverHelperData) {
      const currentData = {
        driverName: (formData.driverName || "").trim(),
        driverPhone: formData.driverPhone || "",
        driverLanguage: formData.driverLanguage || "en",
        driverAadhar: (formData.driverAadhar || "").trim(), // Add this
        helperName: (formData.helperName || "").trim(),
        helperPhone: formData.helperPhone || "",
        helperLanguage: formData.helperLanguage || "en",
        helperAadhar: (formData.helperAadhar || "").trim(), // Add this
      };

      if (!compareDriverHelperData(currentData, savedDriverHelperData)) {
        setSavedDriverHelperData(null);
      }
    }
  }, [
    formData.driverName,
    formData.driverPhone,
    formData.driverLanguage,
    formData.driverAadhar, // Add this
    formData.helperName,
    formData.helperPhone,
    formData.helperLanguage,
    formData.helperAadhar, // Add this
    savedDriverHelperData,
  ]);

  // Track changes to driver fields
  useEffect(() => {
    if (savedDriverData) {
      const hasChanged =
        formData.driverName !== savedDriverData.name ||
        formData.driverPhone !== savedDriverData.phoneNo ||
        formData.driverLanguage !== savedDriverData.language ||
        normalizeAadharValue(formData.driverAadhar) !==
          normalizeAadharValue(savedDriverData.uid);
      setDriverChanged(hasChanged);
    }
  }, [
    formData.driverName,
    formData.driverPhone,
    formData.driverLanguage,
    formData.driverAadhar,
    savedDriverData,
  ]);

  // Track changes to helper fields
  useEffect(() => {
    if (savedHelperData) {
      const hasChanged =
        formData.helperName !== savedHelperData.name ||
        formData.helperPhone !== savedHelperData.phoneNo ||
        formData.helperLanguage !== savedHelperData.language ||
        normalizeAadharValue(formData.helperAadhar) !==
          normalizeAadharValue(savedHelperData.uid);
      setHelperChanged(hasChanged);
    }
  }, [
    formData.helperName,
    formData.helperPhone,
    formData.helperLanguage,
    formData.helperAadhar,
    savedHelperData,
  ]);

  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [mockNotice, setMockNotice] = useState("");
  const [showNotify, setShowNotify] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVariant, setPopupVariant] = useState("info");
  const [dapName, setDapName] = useState("");
  const [loadingDap, setLoadingDap] = useState(false);

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
        "driverAadhar", // Add this
        "helperAadhar", // Add this
      ],
      2: ["_anyDocument"],
    }),
    []
  );

  const formatVehicleNumber = (value) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9-\s↑△▲]/g, "") // Allow letters, numbers, spaces, hyphens, and arrow symbols
      .slice(0, 20);

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
    // Format Aadhar - only digits, max 12
    if (field === "driverAadhar" || field === "helperAadhar") {
      nextValue = normalizeAadharValue(value);
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
      const uploadFormData = new FormData();
      uploadFormData.append("file", stagedFile);
      uploadFormData.append("document_type", selectedDocType);

      // Add reference fields based on what's available
      if (formData.vehicleNumber) {
        uploadFormData.append("vehicle_number", formData.vehicleNumber.trim());
      }
      if (formData.poNumber) {
        uploadFormData.append("po_number", formData.poNumber.trim());
      }
      if (formData.driverPhone) {
        uploadFormData.append("driver_phone", formData.driverPhone);
      }
      if (formData.helperPhone) {
        uploadFormData.append("helper_phone", formData.helperPhone);
      }

      // Call API to upload document
      const response = await documentsAPI.uploadToDocumentControl(
        uploadFormData
      );

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
            fromDatabase: true,
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
    if (fileToDelete?.documentId && fileToDelete?.fromDatabase) {
      // Ask for confirmation before deleting from database
      const confirmDelete = window.confirm(
        "This document is stored in the database. Do you want to delete it permanently?"
      );

      if (!confirmDelete) {
        return;
      }

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
        if (field === "driverAadhar") {
          // Skip validation if driver exists and hasn't changed
          if (!(driverExists && !driverChanged)) {
            const normalizedDriverAadhar = normalizeAadharValue(
              formData.driverAadhar
            );
            if (!normalizedDriverAadhar) {
              validationErrors.driverAadhar =
                "Driver Aadhar number is required.";
            } else if (normalizedDriverAadhar.length !== 12) {
              validationErrors.driverAadhar =
                "Driver Aadhar must be exactly 12 digits.";
            }
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
        if (field === "helperAadhar") {
          // Skip validation if helper exists and hasn't changed
          if (!(helperExists && !helperChanged)) {
            const normalizedHelperAadhar = normalizeAadharValue(
              formData.helperAadhar
            );
            if (!normalizedHelperAadhar) {
              validationErrors.helperAadhar =
                "Helper Aadhar number is required.";
            } else if (normalizedHelperAadhar.length !== 12) {
              validationErrors.helperAadhar =
                "Helper Aadhar must be exactly 12 digits.";
            }
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
    [files, formData, driverExists, driverChanged, helperExists, helperChanged]
  );

  const handleAddDriver = async () => {
    // Validate driver fields
    const errors = {};
    const normalizedDriverAadhar = normalizeAadharValue(formData.driverAadhar);
    if (!(formData.driverName || "").trim()) {
      errors.driverName = "Driver name is required";
    }
    if (!formData.driverPhone) {
      errors.driverPhone = "Driver phone is required";
    }
    if (!normalizedDriverAadhar) {
      errors.driverAadhar = "Driver Aadhar is required";
    } else if (normalizedDriverAadhar.length !== 12) {
      errors.driverAadhar = "Driver Aadhar must be exactly 12 digits";
    }

    if (Object.keys(errors).length > 0) {
      setErrors((prev) => ({ ...prev, ...errors }));
      showPopupMessage("Please fill all driver fields", "warning");
      return;
    }

    try {
      setLoading(true);
      const driverPayload = {
        name: (formData.driverName || "").trim(),
        phoneNo: formData.driverPhone,
        type: "Driver",
        language: formData.driverLanguage,
        uid: normalizedDriverAadhar,
      };

      const response = await driversAPI.validateOrCreate(driverPayload);
      console.log("Driver created:", response.data);

      setDriverExists(true);
      showPopupMessage("Driver added successfully", "info");
    } catch (error) {
      console.error("Failed to add driver:", error);
      showPopupMessage(
        error.response?.data?.error || "Failed to add driver",
        "warning"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddHelper = async () => {
    // Validate helper fields
    const errors = {};
    const normalizedHelperAadhar = normalizeAadharValue(formData.helperAadhar);
    if (!(formData.helperName || "").trim()) {
      errors.helperName = "Helper name is required";
    }
    if (!formData.helperPhone) {
      errors.helperPhone = "Helper phone is required";
    }
    if (!normalizedHelperAadhar) {
      errors.helperAadhar = "Helper Aadhar is required";
    } else if (normalizedHelperAadhar.length !== 12) {
      errors.helperAadhar = "Helper Aadhar must be exactly 12 digits";
    }

    if (Object.keys(errors).length > 0) {
      setErrors((prev) => ({ ...prev, ...errors }));
      showPopupMessage("Please fill all helper fields", "warning");
      return;
    }

    try {
      setLoading(true);
      const helperPayload = {
        name: (formData.helperName || "").trim(),
        phoneNo: formData.helperPhone,
        type: "Helper",
        language: formData.helperLanguage,
        uid: normalizedHelperAadhar,
      };

      const response = await driversAPI.validateOrCreate(helperPayload);
      console.log("Helper created:", response.data);

      setHelperExists(true);
      showPopupMessage("Helper added successfully", "info");
    } catch (error) {
      console.error("Failed to add helper:", error);
      showPopupMessage(
        error.response?.data?.error || "Failed to add helper",
        "warning"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle driver modal save
  const handleDriverModalSave = async (driverData) => {
    try {
      setLoading(true);
      const requestedUid = normalizeAadharValue(driverData.aadhar);
      const payload = {
        name: driverData.name.trim(),
        phoneNo: driverData.phone,
        type: "Driver",
        language: driverData.language,
        uid: requestedUid,
      };

      const response = await driversAPI.validateOrCreate(payload);
      const newDriver = response.data.driver;

      const responseUid = normalizeAadharValue(newDriver?.uid);
      const finalUid = responseUid || requestedUid;

      // Update form with new driver data
      setFormData((prev) => ({
        ...prev,
        driverName: newDriver.name,
        driverPhone: newDriver.phoneNo,
        driverLanguage: newDriver.language,
        driverAadhar: finalUid,
      }));

      // Add to drivers list
      setAllDrivers((prev) => [newDriver, ...prev]);
      setSavedDriverData(newDriver);
      setDriverExists(true);

      setShowDriverModal(false);
      showPopupMessage("New driver added successfully", "info");
    } catch (error) {
      console.error("Failed to add driver:", error);

      // Enhanced error handling
      let errorMessage = "Failed to add driver";

      if (error.response?.data) {
        const data = error.response.data;

        // Check for specific field errors
        if (data.uid) {
          errorMessage = Array.isArray(data.uid) ? data.uid[0] : data.uid;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.phoneNo) {
          errorMessage = Array.isArray(data.phoneNo)
            ? data.phoneNo[0]
            : data.phoneNo;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        }
      }

      showPopupMessage(errorMessage, "warning");
    } finally {
      setLoading(false);
    }
  };

  // Handle helper modal save
  const handleHelperModalSave = async (helperData) => {
    try {
      setLoading(true);
      const requestedUid = normalizeAadharValue(helperData.aadhar);
      const payload = {
        name: helperData.name.trim(),
        phoneNo: helperData.phone,
        type: "Helper",
        language: helperData.language,
        uid: requestedUid,
      };

      const response = await driversAPI.validateOrCreate(payload);
      const newHelper = response.data.driver;

      const responseUid = normalizeAadharValue(newHelper?.uid);
      const finalUid = responseUid || requestedUid;

      // Update form with new helper data
      setFormData((prev) => ({
        ...prev,
        helperName: newHelper.name,
        helperPhone: newHelper.phoneNo,
        helperLanguage: newHelper.language,
        helperAadhar: finalUid,
      }));

      // Add to helpers list
      setAllHelpers((prev) => [newHelper, ...prev]);
      setSavedHelperData(newHelper);
      setHelperExists(true);

      setShowHelperModal(false);
      showPopupMessage("New helper added successfully", "info");
    } catch (error) {
      console.error("Failed to add helper:", error);

      // Enhanced error handling
      let errorMessage = "Failed to add helper";

      if (error.response?.data) {
        const data = error.response.data;

        // Check for specific field errors
        if (data.uid) {
          errorMessage = Array.isArray(data.uid) ? data.uid[0] : data.uid;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.phoneNo) {
          errorMessage = Array.isArray(data.phoneNo)
            ? data.phoneNo[0]
            : data.phoneNo;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        }
      }

      showPopupMessage(errorMessage, "warning");
    } finally {
      setLoading(false);
    }
  };

  // Handle driver selection from dropdown
  const handleDriverSelect = async (driver) => {
    setFormData((prev) => ({
      ...prev,
      driverName: driver.name,
      driverPhone: driver.phoneNo,
      driverLanguage: driver.language,
      driverAadhar: normalizeAadharValue(driver.uid),
    }));
    setDriverSearch(driver.name);
    setDriverDropdownOpen(false);
    setSavedDriverData(driver);
    setDriverExists(true);

    // Auto-fill driver's documents
    if (formData.vehicleNumber) {
      try {
        const response = await vehiclesAPI.getVehicleCompleteData(
          formData.vehicleNumber
        );
        const { documents } = response.data;

        if (documents && documents.length > 0) {
          const driverDocs = documents.filter(
            (doc) =>
              doc.referenceId === driver.id && doc.type === "driver_aadhar"
          );

          if (driverDocs.length > 0) {
            setFiles((prev) => {
              const newFiles = { ...prev };
              const driverAadharFiles = driverDocs.map((doc) => ({
                name: doc.name || `${doc.type_display}.pdf`,
                documentId: doc.id,
                filePath: doc.filePath,
                type: "application/pdf",
                size: 0,
                uploaded: true,
                fromDatabase: true,
              }));

              newFiles.driverAadhar = driverAadharFiles;
              return newFiles;
            });

            showPopupMessage(`Driver's Aadhar document auto-filled`, "info");
          }
        }
      } catch (error) {
        console.error("Failed to fetch driver documents:", error);
      }
    }
  };

  // Handle helper selection from dropdown
  const handleHelperSelect = async (helper) => {
    setFormData((prev) => ({
      ...prev,
      helperName: helper.name,
      helperPhone: helper.phoneNo,
      helperLanguage: helper.language,
      helperAadhar: normalizeAadharValue(helper.uid),
    }));
    setHelperSearch(helper.name);
    setHelperDropdownOpen(false);
    setSavedHelperData(helper);
    setHelperExists(true);

    // Auto-fill helper's documents
    if (formData.vehicleNumber) {
      try {
        const response = await vehiclesAPI.getVehicleCompleteData(
          formData.vehicleNumber
        );
        const { documents } = response.data;

        if (documents && documents.length > 0) {
          const helperDocs = documents.filter(
            (doc) =>
              doc.referenceId === helper.id && doc.type === "helper_aadhar"
          );

          if (helperDocs.length > 0) {
            setFiles((prev) => {
              const newFiles = { ...prev };
              const helperAadharFiles = helperDocs.map((doc) => ({
                name: doc.name || `${doc.type_display}.pdf`,
                documentId: doc.id,
                filePath: doc.filePath,
                type: "application/pdf",
                size: 0,
                uploaded: true,
                fromDatabase: true,
              }));

              newFiles.helperAadhar = helperAadharFiles;
              return newFiles;
            });

            showPopupMessage(`Helper's Aadhar document auto-filled`, "info");
          }
        }
      } catch (error) {
        console.error("Failed to fetch helper documents:", error);
      }
    }
  };

  const handleSaveDriver = async () => {
    // Validate driver fields
    const errors = {};
    const normalizedDriverAadhar = normalizeAadharValue(formData.driverAadhar);
    if (!(formData.driverName || "").trim()) {
      errors.driverName = "Driver name is required";
    }
    if (!formData.driverPhone) {
      errors.driverPhone = "Driver phone is required";
    }
    if (!normalizedDriverAadhar || normalizedDriverAadhar.length !== 12) {
      errors.driverAadhar = "Driver Aadhar must be exactly 12 digits";
    }

    if (Object.keys(errors).length > 0) {
      setErrors((prev) => ({ ...prev, ...errors }));
      showPopupMessage("Please fill all driver fields correctly", "warning");
      return;
    }

    try {
      setSavingDriver(true);
      const driverPayload = {
        name: (formData.driverName || "").trim(),
        phoneNo: formData.driverPhone,
        type: "Driver",
        language: formData.driverLanguage,
        uid: normalizedDriverAadhar,
      };

      const response = await driversAPI.saveDriver(driverPayload);
      console.log("Driver saved:", response.data);

      setFormData((prev) => ({
        ...prev,
        driverAadhar:
          normalizeAadharValue(response.data?.driver?.uid) || normalizedDriverAadhar,
      }));

      setSavedDriverData(response.data.driver);
      setDriverExists(true);
      setDriverChanged(false);

      // Add to drivers list if not already there
      setAllDrivers((prev) => {
        const exists = prev.some((d) => d.id === response.data.driver.id);
        if (exists) return prev;
        return [response.data.driver, ...prev];
      });

      showPopupMessage(
        response.data.message || "Driver info saved successfully",
        "info"
      );
    } catch (error) {
      console.error("Failed to save driver:", error);

      // Extract error message
      let errorMessage = "Failed to save driver";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.uid) {
        errorMessage = Array.isArray(error.response.data.uid)
          ? error.response.data.uid[0]
          : error.response.data.uid;
      } else if (error.response?.data?.phoneNo) {
        errorMessage = Array.isArray(error.response.data.phoneNo)
          ? error.response.data.phoneNo[0]
          : error.response.data.phoneNo;
      }

      showPopupMessage(errorMessage, "warning");
    } finally {
      setSavingDriver(false);
    }
  };

  const handleSaveHelper = async () => {
    // Validate helper fields
    const errors = {};
    const normalizedHelperAadhar = normalizeAadharValue(formData.helperAadhar);
    if (!(formData.helperName || "").trim()) {
      errors.helperName = "Helper name is required";
    }
    if (!formData.helperPhone) {
      errors.helperPhone = "Helper phone is required";
    }
    if (!normalizedHelperAadhar || normalizedHelperAadhar.length !== 12) {
      errors.helperAadhar = "Helper Aadhar must be exactly 12 digits";
    }

    if (Object.keys(errors).length > 0) {
      setErrors((prev) => ({ ...prev, ...errors }));
      showPopupMessage("Please fill all helper fields correctly", "warning");
      return;
    }

    try {
      setSavingHelper(true);
      const helperPayload = {
        name: (formData.helperName || "").trim(),
        phoneNo: formData.helperPhone,
        type: "Helper",
        language: formData.helperLanguage,
        uid: normalizedHelperAadhar,
      };

      const response = await driversAPI.saveHelper(helperPayload);
      console.log("Helper saved:", response.data);

      setFormData((prev) => ({
        ...prev,
        helperAadhar:
          normalizeAadharValue(response.data?.driver?.uid) || normalizedHelperAadhar,
      }));

      setSavedHelperData(response.data.driver);
      setHelperExists(true);
      setHelperChanged(false);

      // Add to helpers list if not already there
      setAllHelpers((prev) => {
        const exists = prev.some((h) => h.id === response.data.driver.id);
        if (exists) return prev;
        return [response.data.driver, ...prev];
      });

      showPopupMessage(
        response.data.message || "Helper info saved successfully",
        "info"
      );
    } catch (error) {
      console.error("Failed to save helper:", error);

      // Extract error message
      let errorMessage = "Failed to save helper";

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.uid) {
        errorMessage = Array.isArray(error.response.data.uid)
          ? error.response.data.uid[0]
          : error.response.data.uid;
      } else if (error.response?.data?.phoneNo) {
        errorMessage = Array.isArray(error.response.data.phoneNo)
          ? error.response.data.phoneNo[0]
          : error.response.data.phoneNo;
      }

      showPopupMessage(errorMessage, "warning");
    } finally {
      setSavingHelper(false);
    }
  };

  const handleNextStep = async () => {
    const currentStepFields = stepFieldMap[currentStep];

    // If on step 0, sync poSearch with formData.poNumber
  if (currentStep === 0) {
    const poValue = String(poSearch || formData.poNumber || "").trim();
    if (poValue && poValue !== formData.poNumber) {
      setFormData((prev) => ({
        ...prev,
        poNumber: poValue,
      }));
      // Wait for state to update
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

    if (!validateFields(currentStepFields)) {
      // Check if there are any empty required fields
      const hasEmptyFields = currentStepFields.some((field) => {
        if (field === "_anyDocument") {
          return !Object.values(files).some((arr) =>
            Array.isArray(arr) ? arr.length > 0 : !!arr
          );
        }

        // Check if field is empty
        if (
          field === "customerEmail" ||
          field === "vehicleNumber" ||
          field === "poNumber" ||
          field === "driverName" ||
          field === "driverPhone" ||
          field === "driverAadhar" ||
          field === "helperName" ||
          field === "helperPhone" ||
          field === "helperAadhar"
        ) {
          return (
            !formData[field] ||
            (typeof formData[field] === "string" && !formData[field].trim())
          );
        }

        return false;
      });

      // Only show the generic popup if there are empty fields
      // Format errors will be shown under the field itself
      if (hasEmptyFields) {
        showPopupMessage(
          "Please fill in all required fields before proceeding.",
          "warning"
        );
      }

      return;
    }

    // If on step 0, save vehicle and PO before proceeding
    if (currentStep === 0) {
      try {
        setLoading(true);

        // Track what was created
        let vehicleCreated = false;
        let poCreated = false;
        const createdItems = [];

        // Create/get vehicle first
        if (formData.vehicleNumber.trim()) {
          const vehicleResponse = await vehiclesAPI.createOrGetVehicle(
            formData.vehicleNumber
          );
          vehicleCreated = vehicleResponse.data.created;

          if (vehicleCreated) {
            createdItems.push("Vehicle");
          }

          const { driver, helper, po_number } = vehicleResponse.data;

          // Auto-fill driver and helper for Step 1
          const updates = {};
          let hasDriver = false;
          let hasHelper = false;

          if (driver) {
            updates.driverName = driver.name || "";
            updates.driverPhone = driver.phoneNo || "";
            updates.driverLanguage = driver.language || "en";
            hasDriver = true;
          }

          if (helper) {
            updates.helperName = helper.name || "";
            updates.helperPhone = helper.phoneNo || "";
            updates.helperLanguage = helper.language || "en";
            hasHelper = true;
          }

          if (Object.keys(updates).length > 0) {
            setFormData((prev) => ({ ...prev, ...updates }));

            // Show combined message only if not shown before
            if (!hasShownDriverHelperPopup) {
              if (hasDriver && hasHelper) {
                showPopupMessage("Driver and Helper info auto-filled", "info");
              } else if (hasDriver) {
                showPopupMessage("Driver info auto-filled", "info");
              } else if (hasHelper) {
                showPopupMessage("Helper info auto-filled", "info");
              }
              setHasShownDriverHelperPopup(true);
            }
          }

          setVehicleSaved(true);
        }

        // Create/get PO after vehicle is saved
        if (formData.poNumber.trim()) {
          try {
            const poResponse = await poDetailsAPI.createOrGetPO(
              formData.poNumber
            );
            poCreated = poResponse.data.created;

            if (poCreated) {
              createdItems.push("PO");
            }

            const poData = poResponse.data.po;

            // Extract dapName
            if (poData && poData.dapName) {
              if (typeof poData.dapName === "object" && poData.dapName.name) {
                setDapName(poData.dapName.name);
              } else if (typeof poData.dapName === "string") {
                setDapName(poData.dapName);
              }
            } else {
              setDapName("");
            }
          } catch (poError) {
            console.error("Failed to create/get PO:", poError);
            showPopupMessage(
              "Failed to save PO details, but you can continue",
              "warning"
            );
          }
        }

        // Show success message based on what was created
        if (createdItems.length > 0) {
          const message = `${createdItems.join(
            " and "
          )} numbers created successfully`;
          showPopupMessage(message, "info");
        }
      } catch (error) {
        console.error("Failed to save vehicle:", error);
        showPopupMessage(
          "Failed to save vehicle details, but you can continue",
          "warning"
        );
      } finally {
        setLoading(false);
      }
    }
    // If on step 1, save driver and helper info ONLY if data has changed
    if (currentStep === 1) {
      // Validate that all required fields are filled before proceeding
      const step1Errors = {};
      const normalizedDriverAadhar = normalizeAadharValue(formData.driverAadhar);
      const normalizedHelperAadhar = normalizeAadharValue(formData.helperAadhar);

      // Driver validation
      if (!formData.driverName || !(formData.driverName || "").trim()) {
        step1Errors.driverName = "Driver name is required";
      }
      if (!formData.driverPhone) {
        step1Errors.driverPhone = "Driver phone is required";
      }
      if (
        !normalizedDriverAadhar ||
        normalizedDriverAadhar.length !== 12
      ) {
        step1Errors.driverAadhar = "Driver Aadhar must be exactly 12 digits";
      }

      // Helper validation
      if (!formData.helperName || !(formData.helperName || "").trim()) {
        step1Errors.helperName = "Helper name is required";
      }
      if (!formData.helperPhone) {
        step1Errors.helperPhone = "Helper phone is required";
      }
      if (
        !normalizedHelperAadhar ||
        normalizedHelperAadhar.length !== 12
      ) {
        step1Errors.helperAadhar = "Helper Aadhar must be exactly 12 digits";
      }

      if (Object.keys(step1Errors).length > 0) {
        setErrors((prev) => ({ ...prev, ...step1Errors }));
        showPopupMessage(
          "Please fill in all driver and helper fields correctly",
          "warning"
        );
        return;
      }

      // Create current data snapshot - with safety checks
      const currentDriverHelperData = {
        driverName: (formData.driverName || "").trim(),
        driverPhone: formData.driverPhone || "",
        driverLanguage: formData.driverLanguage || "en",
        driverAadhar: normalizedDriverAadhar,
        helperName: (formData.helperName || "").trim(),
        helperPhone: formData.helperPhone || "",
        helperLanguage: formData.helperLanguage || "en",
        helperAadhar: normalizedHelperAadhar,
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
            name: currentDriverHelperData.driverName,
            phoneNo: currentDriverHelperData.driverPhone,
            type: "Driver",
            language: currentDriverHelperData.driverLanguage,
            uid: currentDriverHelperData.driverAadhar,
          };

          const driverResponse = await driversAPI.validateOrCreate(
            driverPayload
          );
          console.log("Driver saved:", driverResponse.data);

          // Save helper info
          const helperPayload = {
            name: currentDriverHelperData.helperName,
            phoneNo: currentDriverHelperData.helperPhone,
            type: "Helper",
            language: currentDriverHelperData.helperLanguage,
            uid: currentDriverHelperData.helperAadhar,
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

    // If on step 1, fetch and auto-fill documents for step 2
    if (currentStep === 1 && formData.vehicleNumber.trim()) {
      try {
        setLoading(true);

        // Fetch vehicle complete data including documents
        const response = await vehiclesAPI.getVehicleCompleteData(
          formData.vehicleNumber
        );
        const { documents } = response.data;

        if (documents && documents.length > 0) {
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
          const newFiles = { ...files };
          const documentNames = [];

          documents.forEach((doc) => {
            const frontendType = docTypeMapping[doc.type];
            if (frontendType) {
              // Create a file-like object with document info
              const fileObj = {
                name: doc.name || `${doc.type_display}.pdf`,
                documentId: doc.id,
                filePath: doc.filePath,
                type:
                  doc.type === "application/pdf"
                    ? "application/pdf"
                    : "image/jpeg",
                size: 0,
                uploaded: true,
                fromDatabase: true,
              };

              // Add to the appropriate document type array
              if (!newFiles[frontendType]) {
                newFiles[frontendType] = [];
              }

              // Check if document already exists to avoid duplicates
              const exists = newFiles[frontendType].some(
                (f) => f.documentId === doc.id
              );

              if (!exists) {
                newFiles[frontendType] = [...newFiles[frontendType], fileObj];
                documentNames.push(doc.type_display || doc.type);
              }
            }
          });

          setFiles(newFiles);

          // Show success message with document count
          if (documentNames.length > 0) {
            showPopupMessage(
              `${documentNames.length} document${
                documentNames.length > 1 ? "s" : ""
              } auto-filled from previous submission`,
              "info"
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch documents:", error);
        // Don't show error to user, they can still proceed
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

  const resetForm = async () => {
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
    setDriverExists(false);
    setHelperExists(false);
    setDapName("");
    setPoSearch("");
    setVehicleSearch("");
    setHasShownDriverHelperPopup(false);

    // Clear localStorage
    localStorage.removeItem("customerPortal_formData");
    localStorage.removeItem("customerPortal_files");
    localStorage.removeItem("customerPortal_currentStep");

    // Refetch vehicles and PO numbers
    try {
      // Fetch vehicles
      const vehiclesResponse = await vehiclesAPI.getMyVehicles();
      setMyVehicles(vehiclesResponse.data.vehicles || []);
      setVehicles(vehiclesResponse.data.vehicles || []);

      // Fetch PO numbers
      const poResponse = await poDetailsAPI.getMyPOs();
      setPoNumbers(poResponse.data.pos || []);
    } catch (error) {
      console.error("Failed to refresh data:", error);
      // Don't show error to user, they can still continue
    }
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
                  QR Code Sent Successfully!
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  QR code has been emailed to{" "}
                  <span className="font-medium text-gray-900">
                    {formData.customerEmail || "—"}
                  </span>
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  and SMS sent to{" "}
                  <span className="font-medium text-gray-900">
                    {formData.customerPhone || "—"}
                  </span>
                </p>
                <p className="mt-2 text-xs text-blue-600">
                  ℹ️ Check your email inbox (and spam folder)
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
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
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
                          <label className="text-sm font-medium text-gray-700">
                            PO Number<span className="text-red-500"> *</span>
                          </label>
                          {loadingPos ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Loading your PO numbers...</span>
                            </div>
                          ) : (
                            <>
                              {poNumbers.length === 0 && (
                                <p className="mt-2 mb-3 text-sm text-gray-500">
                                  No previously registered PO numbers found. You
                                  can enter a new PO number below.
                                </p>
                              )}
                              <div className="relative mt-2">
                                <input
                                  ref={poInputRef}
                                  type="text"
                                  placeholder="Search or type PO number..."
                                  value={String(poSearch || "")}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setPoSearch(value);
                                    setFormData((prev) => ({
                                      ...prev,
                                      poNumber: value,
                                    }));
                                    setPoDropdownOpen(true);
                                  }}
                                  onFocus={() => setPoDropdownOpen(true)}
                                  onBlur={() => {
                                    // Keep the PO number in form data even after blur
                                    if (poSearch) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        poNumber: poSearch,
                                      }));
                                    }
                                  }}
                                  className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    errors.poNumber
                                      ? "border-red-400 bg-red-50 placeholder:text-red-400"
                                      : "border-gray-300 bg-white"
                                  }`}
                                  autoComplete="off"
                                />
                                <ChevronDown className="absolute right-4 top-5 h-4 w-4 text-gray-400 pointer-events-none" />

                                {poDropdownOpen && poNumbers.length > 0 && (
                                  <div
                                    ref={poListRef}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                                  >
                                    {poNumbers
                                      .filter((po) => {
                                        // Ensure both values are strings before comparing
                                        const poId = String(
                                          po?.id || ""
                                        ).toLowerCase();
                                        const searchTerm = String(
                                          poSearch || ""
                                        ).toLowerCase();
                                        return poId.includes(searchTerm);
                                      })
                                      .map((po) => (
                                        <button
                                          type="button"
                                          key={po.id}
                                          onClick={(e) => {
            e.preventDefault();
            const poValue = String(po.id);
            setPoSearch(poValue);
            setPoDropdownOpen(false);
            
            // Update formData synchronously
            setFormData((prev) => {
              const updated = {
                ...prev,
                poNumber: poValue,
              };
              // Fetch DAP data after state update
              setTimeout(() => handlePONumberBlur(poValue), 0);
              return updated;
            });
            
            // Clear any existing PO validation error
            clearFieldError("poNumber");
          }}
                                          className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0 disabled:opacity-50"
                                        >
                                          {po.id}
                                        </button>
                                      ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
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
                        <div>
                          <label
                            htmlFor="dapName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Delivery At Place (DAP)
                          </label>
                          <div className="mt-2 relative">
                            <input
                              id="dapName"
                              name="dapName"
                              type="text"
                              value={dapName}
                              readOnly
                              placeholder="DAP"
                              className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-900 cursor-not-allowed"
                            />
                            {loadingDap && (
                              <div className="absolute right-4 top-3">
                                <Loader className="h-4 w-4 animate-spin text-blue-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

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
                            Vehicle Number
                            <span className="text-red-500"> *</span>
                          </label>
                          {loadingVehicles ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Loading your vehicles...</span>
                            </div>
                          ) : (
                            <>
                              {vehicles.length === 0 && (
                                <p className="mt-2 mb-3 text-sm text-gray-500">
                                  No previously registered vehicles found. You
                                  can enter a new vehicle number below.
                                </p>
                              )}
                              <div className="relative mt-2">
                                <input
                                  ref={vehicleInputRef}
                                  type="text"
                                  placeholder="Search or type vehicle number..."
                                  value={vehicleSearch}
                                  onChange={(e) => {
                                    setVehicleSearch(e.target.value);
                                    setFormData((prev) => ({
                                      ...prev,
                                      vehicleNumber: e.target.value,
                                    }));
                                    setVehicleDropdownOpen(true);
                                  }}
                                  onFocus={() => setVehicleDropdownOpen(true)}
                                  onBlur={() => {
                                    // Keep the vehicle number in form data even after blur
                                    if (vehicleSearch && !selectedVehicle) {
                                      setFormData((prev) => ({
                                        ...prev,
                                        vehicleNumber: vehicleSearch,
                                      }));
                                    }
                                  }}
                                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                />
                                <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" />

                                {vehicleDropdownOpen && vehicles.length > 0 && (
                                  <div
                                    ref={vehicleListRef}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                                  >
                                    {vehicles
                                      .filter((v) => {
                                        const vehicleNo = String(
                                          v?.vehicleRegistrationNo || ""
                                        ).toLowerCase();
                                        const searchTerm = String(
                                          vehicleSearch || ""
                                        ).toLowerCase();
                                        return vehicleNo.includes(searchTerm);
                                      })
                                      .map((vehicle) => (
                                        <button
                                          type="button"
                                          key={vehicle.id}
                                          onClick={async (e) => {
                                            e.preventDefault();
                                            setSelectedVehicle(vehicle);
                                            setVehicleSearch(
                                              vehicle.vehicleRegistrationNo
                                            );
                                            setVehicleDropdownOpen(false);
                                            setFormData((prev) => ({
                                              ...prev,
                                              vehicleNumber:
                                                vehicle.vehicleRegistrationNo,
                                            }));
                                            await fetchVehicleData(
                                              vehicle.vehicleRegistrationNo
                                            );
                                          }}
                                          disabled={loadingVehicleData}
                                          className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0 disabled:opacity-50"
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
                            </>
                          )}
                          {errors.vehicleNumber && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{errors.vehicleNumber}</span>
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
                            htmlFor="vehicleRatings"
                            className="text-sm font-medium text-gray-700"
                          >
                            Ratings
                          </label>
                          <input
                            id="vehicleRatings"
                            name="vehicleRatings"
                            type="text"
                            value={formData.vehicleRatings}
                            readOnly
                            placeholder="Ratings will auto-fill"
                            className="mt-2 w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-900 cursor-not-allowed"
                          />
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

                  {autoFillData &&
                    (autoFillData.driver || autoFillData.helper) && (
                      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">
                            Auto-filled from previous submission:
                          </p>
                          <ul className="mt-1 list-disc list-inside">
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
                  <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-3">
                        <User
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold text-gray-800">
                          Driver Details
                        </h2>
                      </div>

                      {savedDriverData && !driverChanged && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">
                              Using saved driver info
                            </p>
                            <p className="text-xs mt-1">
                              You can continue with this driver or change the
                              details below
                            </p>
                          </div>
                        </div>
                      )}

                      {driverChanged && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Driver info changed</p>
                            <p className="text-xs mt-1">
                              Save the changes or add as a new driver
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 grid gap-6">
                        <div>
                          <label
                            htmlFor="driverName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Driver name<span className="text-red-500"> *</span>
                          </label>
                          <div className="relative mt-2">
                            <input
                              ref={driverInputRef}
                              id="driverName"
                              name="driverName"
                              type="text"
                              value={driverSearch || formData.driverName}
                              onChange={(e) => {
                                setDriverSearch(e.target.value);
                                handleInputChange("driverName", e.target.value);
                                setDriverDropdownOpen(true);
                              }}
                              onFocus={() => setDriverDropdownOpen(true)}
                              placeholder="Search or type driver name..."
                              className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                errors.driverName
                                  ? "border-red-400 bg-red-50"
                                  : "border-gray-300 bg-white"
                              }`}
                              autoComplete="name"
                            />
                            {driverDropdownOpen && allDrivers.length > 0 && (
                              <div
                                ref={driverListRef2}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                              >
                                {console.log(
                                  "Rendering driver dropdown with drivers:",
                                  allDrivers
                                )}
                                {allDrivers
                                  .filter((driver) =>
                                    driverSearch
                                      ? driver.name
                                          .toLowerCase()
                                          .includes(driverSearch.toLowerCase())
                                      : true
                                  )
                                  .map((driver) => (
                                    <button
                                      type="button"
                                      key={driver.id}
                                      onClick={() => handleDriverSelect(driver)}
                                      className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                    >
                                      <div className="font-medium">
                                        {driver.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {driver.phoneNo} • {driver.uid}
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
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
                            htmlFor="driverAadhar"
                            className="text-sm font-medium text-gray-700"
                          >
                            Driver Aadhar No.
                            <span className="text-red-500"> *</span>
                          </label>
                          <input
                            id="driverAadhar"
                            name="driverAadhar"
                            type="text"
                            inputMode="numeric"
                            value={formData.driverAadhar}
                            onChange={(e) =>
                              handleInputChange("driverAadhar", e.target.value)
                            }
                            placeholder="12-digit Aadhar number"
                            readOnly={driverExists && !driverChanged}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              driverExists && !driverChanged
                                ? "bg-gray-100"
                                : ""
                            } ${
                              errors.driverAadhar
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300 bg-white"
                            }`}
                            maxLength={12}
                          />
                          {driverExists && !driverChanged && (
                            <p className="mt-1 text-xs text-gray-500">
                              Aadhar number is locked for saved driver
                            </p>
                          )}
                          {errors.driverAadhar && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{errors.driverAadhar}</span>
                            </div>
                          )}
                        </div>

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
                            <div className="relative">
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
                                        (l) =>
                                          l.value === formData.driverLanguage
                                      )?.label
                                    }
                                  </span>
                                  <svg
                                    className={`ml-auto h-4 w-4 text-gray-500 transform ${
                                      prefDropdownOpen
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
                                          const filtered = languages.filter(
                                            (l) =>
                                              l.label
                                                .toLowerCase()
                                                .includes(
                                                  prefSearch.toLowerCase()
                                                )
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
                                          const filtered = languages.filter(
                                            (l) =>
                                              l.label
                                                .toLowerCase()
                                                .includes(
                                                  prefSearch.toLowerCase()
                                                )
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
                                            formData.driverLanguage ===
                                            opt.value
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
                                            formData.driverLanguage ===
                                            opt.value
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

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleSaveDriver}
                            disabled={
                              savingDriver || (!driverChanged && driverExists)
                            }
                            className="hidden inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {savingDriver ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4" />
                                Save Driver Info
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowDriverModal(true)}
                            disabled={loading || savingDriver}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-300"
                          >
                            <User className="h-4 w-4" />
                            Add New Driver
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {driverChanged
                            ? "Save to update existing driver or Add New to create a separate entry"
                            : driverExists
                            ? "Driver info is saved. Change any field to update."
                            : "Fill in driver details and save or add as new"}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-3">
                        <User
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />
                        <h2 className="text-lg font-semibold text-gray-800">
                          Helper Details
                        </h2>
                      </div>

                      {savedHelperData && !helperChanged && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">
                              Using saved helper info
                            </p>
                            <p className="text-xs mt-1">
                              You can continue with this helper or change the
                              details below
                            </p>
                          </div>
                        </div>
                      )}

                      {helperChanged && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Helper info changed</p>
                            <p className="text-xs mt-1">
                              Save the changes or add as a new helper
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-6 grid gap-6">
                        <div>
                          <label
                            htmlFor="helperName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Helper name<span className="text-red-500"> *</span>
                          </label>
                          <div className="relative mt-2">
                            <input
                              ref={helperInputRef}
                              id="helperName"
                              name="helperName"
                              type="text"
                              value={helperSearch || formData.helperName}
                              onChange={(e) => {
                                setHelperSearch(e.target.value);
                                handleInputChange("helperName", e.target.value);
                                setHelperDropdownOpen(true);
                              }}
                              onFocus={() => setHelperDropdownOpen(true)}
                              placeholder="Search or type helper name..."
                              className={`w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                errors.helperName
                                  ? "border-red-400 bg-red-50"
                                  : "border-gray-300 bg-white"
                              }`}
                              autoComplete="name"
                            />
                            {helperDropdownOpen && allHelpers.length > 0 && (
                              <div
                                ref={helperListRef2}
                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                              >
                                {allHelpers
                                  .filter((helper) =>
                                    helperSearch
                                      ? helper.name
                                          .toLowerCase()
                                          .includes(helperSearch.toLowerCase())
                                      : true
                                  )
                                  .map((helper) => (
                                    <button
                                      type="button"
                                      key={helper.id}
                                      onClick={() => handleHelperSelect(helper)}
                                      className="w-full px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-b-0"
                                    >
                                      <div className="font-medium">
                                        {helper.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {helper.phoneNo} • {helper.uid}
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>
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

                        <div>
                          <label
                            htmlFor="helperAadhar"
                            className="text-sm font-medium text-gray-700"
                          >
                            Helper Aadhar No.
                            <span className="text-red-500"> *</span>
                          </label>
                          <input
                            id="helperAadhar"
                            name="helperAadhar"
                            type="text"
                            inputMode="numeric"
                            value={formData.helperAadhar}
                            onChange={(e) =>
                              handleInputChange("helperAadhar", e.target.value)
                            }
                            placeholder="12-digit Aadhar number"
                            readOnly={helperExists && !helperChanged}
                            className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              helperExists && !helperChanged
                                ? "bg-gray-100"
                                : ""
                            } ${
                              errors.helperAadhar
                                ? "border-red-400 bg-red-50"
                                : "border-gray-300 bg-white"
                            }`}
                            maxLength={12}
                          />
                          {helperExists && !helperChanged && (
                            <p className="mt-1 text-xs text-gray-500">
                              Aadhar number is locked for saved helper
                            </p>
                          )}
                          {errors.helperAadhar && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                              <AlertCircle
                                className="h-4 w-4"
                                aria-hidden="true"
                              />
                              <span>{errors.helperAadhar}</span>
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
                            <div className="relative">
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
                                        (l) =>
                                          l.value === formData.helperLanguage
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
                                          const filtered = languages.filter(
                                            (l) =>
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
                                          const filtered = languages.filter(
                                            (l) =>
                                              l.label
                                                .toLowerCase()
                                                .includes(
                                                  helperPrefSearch.toLowerCase()
                                                )
                                          );
                                          if (filtered[helperPrefHighlight]) {
                                            handleInputChange(
                                              "helperLanguage",
                                              filtered[helperPrefHighlight]
                                                .value
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
                                            formData.helperLanguage ===
                                            opt.value
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
                                            formData.helperLanguage ===
                                            opt.value
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

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={handleSaveHelper}
                            disabled={
                              savingHelper || (!helperChanged && helperExists)
                            }
                            className="hidden inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                          >
                            {savingHelper ? (
                              <>
                                <Loader className="h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4" />
                                Save Helper Info
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowHelperModal(true)}
                            disabled={loading || savingHelper}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-300"
                          >
                            <User className="h-4 w-4" />
                            Add New Helper
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {helperChanged
                            ? "Save to update existing helper or Add New to create a separate entry"
                            : helperExists
                            ? "Helper info is saved. Change any field to update."
                            : "Fill in helper details and save or add as new"}
                        </p>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  {/* Show documents from database */}
                  {/* Previously uploaded documents section removed */}
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
                                      {file.fromDatabase && (
                                        <span className="ml-2 text-green-600">
                                          ✓ Previously uploaded
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleClearUploaded(opt.id, idx)
                                    }
                                    disabled={loading}
                                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {loading ? (
                                      <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Clear"
                                    )}
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

      {/* Driver Modal */}
      <DriverHelperModal
        isOpen={showDriverModal}
        onClose={() => setShowDriverModal(false)}
        type="Driver"
        onSave={handleDriverModalSave}
        loading={loading}
      />

      {/* Helper Modal */}
      <DriverHelperModal
        isOpen={showHelperModal}
        onClose={() => setShowHelperModal(false)}
        type="Helper"
        onSave={handleHelperModalSave}
        loading={loading}
      />
    </div>
  );
};

export default CustomerPortal;
