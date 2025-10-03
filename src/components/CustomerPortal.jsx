import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Globe,
  Phone,
  RefreshCw,
  Scan,
  Send,
  X,
  Truck,
  Upload,
  User,
} from "lucide-react";

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
  { value: "mr", label: "Marathi - मराठी (mr)" },
  { value: "gu", label: "Gujarati - ગુજરાતી (gu)" },
  { value: "ta", label: "Tamil - தமிழ் (ta)" },
];

const documentOptions = [
  { id: "purchaseOrder", label: "Purchase Order (PO)" },
  { id: "vehicleRegistration", label: "Vehicle Registration" },
  { id: "vehicleInsurance", label: "Vehicle Insurance" },
  { id: "puc", label: "PUC" },
  { id: "driverLicense", label: "Driver License" },
  { id: "transportationApproval", label: "Transportation Approval" },
  { id: "paymentApproval", label: "Payment Approval" },
  { id: "vendorApproval", label: "Vendor Approval" },
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
  customerEmail: "",
  customerPhone: "",
  driverPhone: "",
  helperPhone: "",
  driverLanguage: "en",
};

const initialFiles = {
  purchaseOrder: null,
  vehiclePapers: null,
  aadhaarCard: null,
};

// Ensure initialFiles has keys for all dynamic document options
documentOptions.forEach((opt) => {
  if (!(opt.id in initialFiles)) {
    initialFiles[opt.id] = null;
  }
});

const getStoredToken = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return localStorage.getItem("customerToken") || "";
};

const storeToken = (value) => {
  if (typeof window === "undefined") {
    return;
  }
  if (value) {
    localStorage.setItem("customerToken", value);
  } else {
    localStorage.removeItem("customerToken");
  }
};

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

const validateHelperPhone = (value) => {
  if (!value) {
    return "";
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
  const initialToken = getStoredToken();
  const [authToken, setAuthToken] = useState(initialToken);
  const [tokenDraft, setTokenDraft] = useState(initialToken);
  const [showTokenManager, setShowTokenManager] = useState(!initialToken);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState(initialFiles);
  const [errors, setErrors] = useState({});
  const [selectedDocType, setSelectedDocType] = useState(documentOptions[0].id);
  const [stagedFile, setStagedFile] = useState(null);
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [docHighlight, setDocHighlight] = useState(0);
  const docButtonRef = useRef(null);
  const docListRef = useRef(null);

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
  const [prefSearch, setPrefSearch] = useState('');
  const [prefHighlight, setPrefHighlight] = useState(0);
  const prefButtonRef = useRef(null);
  const prefListRef = useRef(null);

  // click-away to close preferred language dropdown
  useEffect(() => {
    const onPrefClickAway = (e) => {
      if (!prefButtonRef.current) return;
      if (prefButtonRef.current.contains(e.target)) return;
      if (prefListRef.current && prefListRef.current.contains && prefListRef.current.contains(e.target)) return;
      setPrefDropdownOpen(false);
    };
    if (prefDropdownOpen) {
      document.addEventListener('click', onPrefClickAway);
    }
    return () => document.removeEventListener('click', onPrefClickAway);
  }, [prefDropdownOpen]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [mockNotice, setMockNotice] = useState("");
  const [showNotify, setShowNotify] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupVariant, setPopupVariant] = useState("info");
  const missingTokenMessage =
    "Authentication token is missing. Please sign in again.";

  useEffect(() => {
    setTokenDraft(authToken);
  }, [authToken]);

  const stepFieldMap = useMemo(
    () => ({
      0: ["customerEmail", "customerPhone", "vehicleNumber"],
      1: ["driverPhone", "helperPhone", "driverLanguage"],
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

  const openTokenPanel = useCallback(() => {
    setShowTokenManager(true);
  }, []);

  const handleTokenSave = useCallback(() => {
    const trimmed = tokenDraft.trim();
    if (!trimmed) {
      storeToken("");
      setAuthToken("");
      setShowTokenManager(true);
      return;
    }
    storeToken(trimmed);
    setAuthToken(trimmed);
    setShowTokenManager(false);
    setSubmitError((previous) =>
      previous === missingTokenMessage ? "" : previous
    );
  }, [tokenDraft, missingTokenMessage]);

  const handleTokenClear = useCallback(() => {
    storeToken("");
    setAuthToken("");
    setTokenDraft("");
    setShowTokenManager(true);
    setSubmitError(missingTokenMessage);
  }, [missingTokenMessage]);

  const toggleTokenPanel = useCallback(() => {
    setShowTokenManager((previous) => !previous);
  }, []);

  const handleInputChange = (field, value) => {
    let nextValue = value;
    if (field === "vehicleNumber") {
      nextValue = formatVehicleNumber(value);
    }
    if (
      field === "driverPhone" ||
      field === "helperPhone" ||
      field === "customerPhone"
    ) {
      nextValue = formatPhoneValue(value);
    }
    setFormData((previous) => ({
      ...previous,
      [field]: nextValue,
    }));
    clearFieldError(field);
  };

  const handleFileSelect = (field, file) => {
    // Prevent overwriting an already uploaded file for the same type
    if (files[field]) {
      showPopupMessage(
        `${
          documentOptions.find((d) => d.id === field)?.label || field
        } already uploaded`,
        "warning"
      );
      return;
    }
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
    setFiles((previous) => ({
      ...previous,
      [field]: file,
    }));
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

  const handleUploadStaged = () => {
    if (!stagedFile) {
      setErrors((previous) => ({
        ...previous,
        staged: "No file selected to upload.",
      }));
      return;
    }
    // Prevent uploading if selected doc type already has a file
    if (files[selectedDocType]) {
      showPopupMessage(
        `${
          documentOptions.find((d) => d.id === selectedDocType)?.label ||
          selectedDocType
        } already uploaded`,
        "warning"
      );
      return;
    }
    // Map id names to allowed stored fields. We'll store dynamic docs under files with their id keys.
    setFiles((previous) => ({ ...previous, [selectedDocType]: stagedFile }));
    setStagedFile(null);
    clearFieldError(selectedDocType);
  };

  const handleClearUploaded = (field) => {
    setFiles((previous) => ({ ...previous, [field]: null }));
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
        if (field === "driverPhone") {
          const result = validatePhone(
            formData.driverPhone,
            "Driver phone number"
          );
          if (result) {
            validationErrors.driverPhone = result;
          }
        }
        if (field === "helperPhone") {
          const result = validateHelperPhone(formData.helperPhone);
          if (result) {
            validationErrors.helperPhone = result;
          }
        }
        if (field === "driverLanguage" && !formData.driverLanguage) {
          validationErrors.driverLanguage =
            "Driver language is required.";
        }
        if (field === "purchaseOrder") {
          const result = validateFile(files.purchaseOrder, "Purchase Order");
          if (result) {
            validationErrors.purchaseOrder = result;
          }
        }
        if (field === "vehiclePapers") {
          const result = validateFile(files.vehiclePapers, "Vehicle Papers");
          if (result) {
            validationErrors.vehiclePapers = result;
          }
        }
        if (field === "aadhaarCard") {
          const result = validateFile(files.aadhaarCard, "Driver Aadhaar Card");
          if (result) {
            validationErrors.aadhaarCard = result;
          }
        }
        if (field === "_anyDocument") {
          const anyUploaded = Object.values(files).some((f) => f);
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

  const handleNextStep = () => {
    const fieldsToValidate = stepFieldMap[currentStep];
    if (validateFields(fieldsToValidate)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
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
    if (!authToken) {
      setSubmitError(missingTokenMessage);
      openTokenPanel();
      return;
    }

    // Check for missing documents first and show popup
    const missingDocs = documentOptions.filter((d) => !files[d.id]);
    if (missingDocs.length > 0) {
      setCurrentStep(2); // Navigate to documents step

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

    if (!validateAll()) {
      // Provide clear feedback to the user and jump to the step containing the first error
      setSubmitError("Please fix the highlighted errors before submitting.");
      // Try to navigate to the first step that contains an error field
      const errorKeys = Object.keys(errors);
      if (errorKeys.length > 0) {
        // find a step that includes any of the error keys
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
    setLoading(true);
    setSubmitError("");
    setMockNotice("");
    const payload = new FormData();
    if (formData.customerEmail) {
      payload.append("customerEmail", formData.customerEmail.trim());
    }
    if (formData.customerPhone) {
      payload.append("customerPhone", formData.customerPhone);
    }
    payload.append("vehicleNumber", formData.vehicleNumber.trim());
    payload.append("driverPhone", formData.driverPhone);
    if (formData.helperPhone) {
      payload.append("helperPhone", formData.helperPhone);
    }
    payload.append("driverLanguage", formData.driverLanguage);
    // Append any uploaded files dynamically. Use snake_case API field names when possible.
    Object.entries(files).forEach(([key, file]) => {
      if (!file) return;
      // map some known keys to expected API field names
      const apiMap = {
        purchaseOrder: "purchase_order",
        vehiclePapers: "vehicle_papers",
        aadhaarCard: "aadhaar_card",
      };
      const apiKey = apiMap[key] || key;
      payload.append(apiKey, file);
    });

    try {
      const response = await fetch("/api/submissions/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: payload,
      });

      if (!response.ok) {
        if (response.status === 404) {
          const fallbackQr =
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEf0lEQVR4nO3dQW7kMBBAUd//0m4kdxiOLUZtImcbzDIKTzPgSrQLfwJn4vVEfPO93nXH9/8XvZ9r3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9XfZd2vf/V32Xdr3/1d9l3a9/9TfZv3Y7eJ59fd+f78d3v2s+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n97uPd/2a+v1S+2953m9n91nuvn3Dzr+1++uFff7P53e++b1/efZ+93+dfed5/dfd+9Lv7PQ0AAAAAAAAAAAAAAAAAAMCvZgYAAACASvS3AQAAANBK9LcBAAAA0Er0twEAAADQSvS3AQAAANBK9LcBAAAA0Er0twEAAADQSr63/X+/f8fvRz8/6MwDAAAAAAAAAAAAAAAAAPBiZwEAAABAl+h/AQAAAKCV6H8BAAAAoJXofwEAAACgl+h/AQAAAKCV6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAA4L5nBgAAAICe7HsBAAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIAd6H8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIA96X8BAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAA4L5nBgAAAIC96HsBAAAAAKDL1wEAAAAAr2YGAABAgI7ofwEAAACgl+h/AQAAAKCV6H8BAAAA4L5nBgAAAIC+cRkAAAAAudF/AgAAAECR6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAMCoZwYAAAAAqdF/AwAAAECR6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAABAk+h/AQAAAKCV6H8BAAAAQJHofwEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgJ7sewEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgtmcGAAAAgD3pfwEAAADgm2cGAAAAgB3ofwEAAADgm2cGAAAAgB3ofwEAAADgm2cGAAAAgB3ofwEAAADgm2cGAAAAgB3ofwEAAADgm2cGAAAAgB3ofwEAAADgm2cGAAAAgB3ofwEAAADg+7oDAAAAAAAAAAAAAAAAAAAA4P8B9Q3FSToMfxYAAAAASUVORK5CYII=";
          setSuccessData({
            qrCodeImage: makeDemoQr(
              formData.vehicleNumber.trim(),
              formData.driverPhone
            ),
            vehicleNumber: formData.vehicleNumber.trim(),
            driverPhone: formData.driverPhone,
          });
          setShowNotify(true);
          setMockNotice(
            "Submission API is unavailable. A demo QR code was generated for testing purposes."
          );
          setSubmitError("");
          return;
        }
        let message = "Unable to submit entry. Please try again.";
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            message = errorData.error;
          }
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch (parseError) {
          // ignore parsing errors and use default message
        }
        if (response.status === 401) {
          openTokenPanel();
        }
        throw new Error(message);
      }

      const data = await response.json();
      const submission = data?.submission;
      if (!submission?.qrCodeImage) {
        throw new Error(
          "Submission succeeded but QR code is unavailable. Contact support."
        );
      }
      setSuccessData({
        qrCodeImage: submission.qrCodeImage,
        vehicleNumber:
          submission.vehicleNumber || formData.vehicleNumber.trim(),
        driverPhone: formData.driverPhone,
      });
      setShowNotify(true);
      setMockNotice("");
    } catch (error) {
      if (!successData) {
        const demoUrl = makeDemoQr(
          formData.vehicleNumber.trim(),
          formData.driverPhone
        );
        setSuccessData({
          qrCodeImage: demoUrl,
          vehicleNumber: formData.vehicleNumber.trim(),
          driverPhone: formData.driverPhone,
        });
        setShowNotify(true);
        setMockNotice(
          "Submission API is unavailable. A demo QR code was generated for testing purposes."
        );
        setSubmitError("");
      } else {
        setSubmitError(error.message);
      }
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
              <button
                type="button"
                onClick={toggleTokenPanel}
                className="inline-flex items-center justify-center rounded-xl border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                {showTokenManager
                  ? "Hide Access Token"
                  : authToken
                  ? "Manage Access Token"
                  : "Set Access Token"}
              </button>
            </header>

            {!authToken && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-5 w-5" aria-hidden="true" />
                <div>
                  <p className="font-semibold">Authorization required</p>
                  <p>
                    Set your customer access token to submit entries
                    successfully.
                  </p>
                </div>
              </div>
            )}

            {showTokenManager && (
              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-lg font-semibold text-blue-900">
                  Customer Access Token
                </h2>
                <p className="mt-2 text-sm text-blue-700">
                  Paste the access token shared with your organization
                  administrator. This token will be used to authorize gate entry
                  submissions.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={tokenDraft}
                    onChange={(event) => setTokenDraft(event.target.value)}
                    placeholder="Enter access token"
                    className="w-full rounded-xl border border-blue-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button
                      type="button"
                      onClick={handleTokenSave}
                      disabled={!tokenDraft.trim()}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                      Save Token
                    </button>
                    {authToken && (
                      <button
                        type="button"
                        onClick={handleTokenClear}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-blue-500 px-4 py-3 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

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
                          onChange={(event) =>
                            handleInputChange(
                              "customerEmail",
                              event.target.value
                            )
                          }
                          placeholder="you@example.com"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            errors.customerEmail
                              ? "border-red-400 bg-red-50 placeholder:text-red-400"
                              : "border-gray-300 bg-white"
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
                          onChange={(event) =>
                            handleInputChange(
                              "customerPhone",
                              event.target.value
                            )
                          }
                          placeholder="+91XXXXXXXXXX"
                          className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            errors.customerPhone
                              ? "border-red-400 bg-red-50 placeholder:text-red-400"
                              : "border-gray-300 bg-white"
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
                        <label
                          htmlFor="vehicleNumber"
                          className="text-sm font-medium text-gray-700"
                        >
                          Vehicle Number<span className="text-red-500"> *</span>
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
                    <div>
                      <label
                        htmlFor="driverPhone"
                        className="text-sm font-medium text-gray-700"
                      >
                        Driver Phone Number
                        <span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="driverPhone"
                        name="driverPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.driverPhone}
                        onChange={(event) =>
                          handleInputChange("driverPhone", event.target.value)
                        }
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.driverPhone
                            ? "border-red-400 bg-red-50 placeholder:text-red-400"
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
                        Helper Phone Number (optional)
                      </label>
                      <input
                        id="helperPhone"
                        name="helperPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.helperPhone}
                        onChange={(event) =>
                          handleInputChange("helperPhone", event.target.value)
                        }
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.helperPhone
                            ? "border-red-400 bg-red-50 placeholder:text-red-400"
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
                    <div className="lg:col-span-2">
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
                                languages.findIndex((l) => l.value === formData.driverLanguage)
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setPrefDropdownOpen(true);
                                setTimeout(() => prefListRef.current?.focus?.(), 0);
                              }
                            }}
                            className={`w-full rounded-xl border ${errors.driverLanguage ? 'border-red-400 bg-red-50' : 'border-gray-300'} bg-white px-4 py-3 text-left text-sm font-medium text-gray-900 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span>{languages.find((l) => l.value === formData.driverLanguage)?.label}</span>
                              <svg className={`ml-auto h-4 w-4 text-gray-500 transform ${prefDropdownOpen ? 'rotate-180' : 'rotate-0'}`} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </button>

                          {prefDropdownOpen && (
                            <div className="absolute left-0 right-0 z-40 mt-2 rounded-xl bg-white border border-gray-200 shadow-lg">
                              <ul role="listbox" tabIndex={-1} ref={prefListRef} className="max-h-60 overflow-auto py-2">
                                {languages.map((opt, idx) => (
                                  <li
                                    key={opt.value}
                                    role="option"
                                    aria-selected={formData.driverLanguage === opt.value}
                                    onClick={() => { handleInputChange('driverLanguage', opt.value); setPrefDropdownOpen(false); }}
                                    onMouseEnter={() => setPrefHighlight(idx)}
                                    className={`cursor-pointer px-4 py-2 text-sm ${formData.driverLanguage === opt.value ? 'bg-blue-50 text-blue-700 font-semibold' : prefHighlight === idx ? 'bg-gray-100' : 'text-gray-700'}`}
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
                                          if (disabled) return;
                                          setSelectedDocType(opt.id);
                                          setDocDropdownOpen(false);
                                        }}
                                        onMouseEnter={() => {
                                          if (!disabled) setDocHighlight(idx);
                                        }}
                                        className={`px-4 py-2 text-sm ${
                                          disabled
                                            ? "text-gray-400 opacity-60 cursor-not-allowed"
                                            : "cursor-pointer"
                                        } ${
                                          selectedDocType === opt.id
                                            ? "bg-blue-50 text-blue-700 font-semibold"
                                            : docHighlight === idx
                                            ? !disabled
                                              ? "bg-gray-100"
                                              : ""
                                            : "text-gray-700"
                                        }`}
                                      >
                                        {opt.label}
                                        {disabled ? " — uploaded" : ""}
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
                        {Object.entries(files)
                          .filter(([, f]) => f)
                          .map(([key, file]) => {
                            const opt = documentOptions.find(
                              (d) => d.id === key
                            );
                            const label = opt ? opt.label : key;
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">
                                      {label}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleClearUploaded(key)}
                                    className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                        {Object.values(files).every((f) => !f) && (
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