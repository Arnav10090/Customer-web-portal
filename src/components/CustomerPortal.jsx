import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Truck,
  Upload,
  User
} from 'lucide-react';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg'
];

const languages = [
  { value: 'en', label: 'English (en)' },
  { value: 'hi', label: 'Hindi - हिंदी (hi)' },
  { value: 'mr', label: 'Marathi - मराठी (mr)' },
  { value: 'gu', label: 'Gujarati - ગુજરાતી (gu)' },
  { value: 'ta', label: 'Tamil - தமிழ் (ta)' }
];

const steps = [
  {
    id: 0,
    title: 'Vehicle Information',
    description: 'Identify the vehicle entering the facility'
  },
  {
    id: 1,
    title: 'Driver Information',
    description: 'Capture driver contact preferences'
  },
  {
    id: 2,
    title: 'Document Uploads',
    description: 'Provide mandatory verification documents'
  }
];

const initialFormData = {
  vehicleNumber: '',
  driverPhone: '',
  helperPhone: '',
  preferredLanguage: 'en'
};

const initialFiles = {
  purchaseOrder: null,
  vehiclePapers: null,
  aadhaarCard: null
};

const validateVehicleNumber = (value) => {
  if (!value.trim()) {
    return 'Vehicle number is required.';
  }
  if (value.trim().length < 2 || value.trim().length > 50) {
    return 'Vehicle number must be between 2 and 50 characters.';
  }
  if (!/^[A-Z0-9-\s]+$/.test(value.trim())) {
    return 'Use only uppercase letters, numbers, spaces, or hyphens.';
  }
  return '';
};

const validatePhone = (value, label) => {
  if (!value) {
    return `${label} is required.`;
  }
  if (!/^\+91\d{10}$/.test(value)) {
    return `${label} must follow +91XXXXXXXXXX format.`;
  }
  return '';
};

const validateHelperPhone = (value) => {
  if (!value) {
    return '';
  }
  if (!/^\+91\d{10}$/.test(value)) {
    return 'Helper phone must follow +91XXXXXXXXXX format.';
  }
  return '';
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
  return '';
};

const DocumentUploadField = ({
  id,
  label,
  description,
  file,
  onFileSelect,
  error
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
        <label htmlFor={`${id}-input`} className="text-sm font-semibold text-gray-800">
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
          if (event.key === 'Enter' || event.key === ' ') {
            triggerBrowse(event);
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50 p-6 text-center transition-all duration-200 hover:border-blue-400 hover:bg-white focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
          error ? 'border-red-400 bg-red-50' : 'border-gray-300'
        }`}
      >
        <Upload className="h-8 w-8 text-blue-500" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-gray-700">
          Drag & drop or <span className="text-blue-600">browse files</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">PDF, JPG, JPEG, PNG up to 5MB</p>
        {file && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
            <span className="text-sm font-medium text-green-700" title={file.name}>
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
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState(initialFiles);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const stepFieldMap = useMemo(
    () => ({
      0: ['vehicleNumber'],
      1: ['driverPhone', 'helperPhone', 'preferredLanguage'],
      2: ['purchaseOrder', 'vehiclePapers', 'aadhaarCard']
    }),
    []
  );

  const formatVehicleNumber = (value) => value.toUpperCase().replace(/[^A-Z0-9-\s]/g, '').slice(0, 50);

  const formatPhoneValue = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      return '';
    }
    const withoutCountry = digits.startsWith('91') ? digits.slice(2) : digits;
    const trimmed = withoutCountry.slice(0, 10);
    return trimmed ? `+91${trimmed}` : '';
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

  const handleInputChange = (field, value) => {
    let nextValue = value;
    if (field === 'vehicleNumber') {
      nextValue = formatVehicleNumber(value);
    }
    if (field === 'driverPhone' || field === 'helperPhone') {
      nextValue = formatPhoneValue(value);
    }
    setFormData((previous) => ({
      ...previous,
      [field]: nextValue
    }));
    clearFieldError(field);
  };

  const handleFileSelect = (field, file) => {
    let errorMessage = '';
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errorMessage = 'Only PDF, JPG, JPEG, or PNG files are accepted.';
    } else if (file.size > MAX_FILE_SIZE) {
      errorMessage = 'File must be 5MB or smaller.';
    }
    if (errorMessage) {
      setErrors((previous) => ({
        ...previous,
        [field]: errorMessage
      }));
      return;
    }
    setFiles((previous) => ({
      ...previous,
      [field]: file
    }));
    clearFieldError(field);
  };

  const validateFields = useCallback(
    (fieldsToValidate) => {
      const validationErrors = {};
      fieldsToValidate.forEach((field) => {
        if (field === 'vehicleNumber') {
          const result = validateVehicleNumber(formData.vehicleNumber);
          if (result) {
            validationErrors.vehicleNumber = result;
          }
        }
        if (field === 'driverPhone') {
          const result = validatePhone(formData.driverPhone, 'Driver phone number');
          if (result) {
            validationErrors.driverPhone = result;
          }
        }
        if (field === 'helperPhone') {
          const result = validateHelperPhone(formData.helperPhone);
          if (result) {
            validationErrors.helperPhone = result;
          }
        }
        if (field === 'preferredLanguage' && !formData.preferredLanguage) {
          validationErrors.preferredLanguage = 'Preferred language is required.';
        }
        if (field === 'purchaseOrder') {
          const result = validateFile(files.purchaseOrder, 'Purchase Order');
          if (result) {
            validationErrors.purchaseOrder = result;
          }
        }
        if (field === 'vehiclePapers') {
          const result = validateFile(files.vehiclePapers, 'Vehicle Papers');
          if (result) {
            validationErrors.vehiclePapers = result;
          }
        }
        if (field === 'aadhaarCard') {
          const result = validateFile(files.aadhaarCard, 'Driver Aadhaar Card');
          if (result) {
            validationErrors.aadhaarCard = result;
          }
        }
      });
      setErrors((previous) => ({ ...previous, ...validationErrors }));
      return Object.keys(validationErrors).length === 0;
    },
    [files.aadhaarCard, files.purchaseOrder, files.vehiclePapers, formData.driverPhone, formData.helperPhone, formData.preferredLanguage, formData.vehicleNumber]
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
    setSubmitError('');
    setCurrentStep(0);
    setSuccessData(null);
  };

  const handleDownloadQr = () => {
    if (!successData?.qrCodeImage) {
      return;
    }
    const link = document.createElement('a');
    const sanitizedVehicle = (successData.vehicleNumber || 'vehicle').replace(/[^A-Z0-9-]+/gi, '-');
    link.href = successData.qrCodeImage;
    link.download = `entry-qr-${sanitizedVehicle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('customerToken') || '';
    if (!token) {
      setSubmitError('Authentication token is missing. Please sign in again.');
      return;
    }
    if (!validateAll()) {
      return;
    }
    setLoading(true);
    setSubmitError('');
    const payload = new FormData();
    payload.append('vehicleNumber', formData.vehicleNumber.trim());
    payload.append('driverPhone', formData.driverPhone);
    if (formData.helperPhone) {
      payload.append('helperPhone', formData.helperPhone);
    }
    payload.append('preferredLanguage', formData.preferredLanguage);
    payload.append('purchase_order', files.purchaseOrder);
    payload.append('vehicle_papers', files.vehiclePapers);
    payload.append('aadhaar_card', files.aadhaarCard);

    try {
      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      });

      if (!response.ok) {
        let message = 'Unable to submit entry. Please try again.';
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
        throw new Error(message);
      }

      const data = await response.json();
      const submission = data?.submission;
      if (!submission?.qrCodeImage) {
        throw new Error('Submission succeeded but QR code is unavailable. Contact support.');
      }
      setSuccessData({
        qrCodeImage: submission.qrCodeImage,
        vehicleNumber: submission.vehicleNumber || formData.vehicleNumber.trim(),
        driverPhone: formData.driverPhone
      });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                <Scan className="h-7 w-7 text-blue-600" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Entry QR Code Generated</h1>
                <p className="text-sm text-gray-500">
                  Share this QR code with the driver for gate access.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 p-6">
                <img
                  src={successData.qrCodeImage}
                  alt="Driver entry QR code"
                  className="h-60 w-60 rounded-xl border border-gray-200 bg-white object-contain p-4"
                />
                <div className="mt-4 space-y-1 text-center">
                  <p className="text-sm text-gray-500">Vehicle Number</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.vehicleNumber}</p>
                  <p className="text-sm text-gray-500">Driver Phone</p>
                  <p className="text-lg font-semibold text-gray-900">{successData.driverPhone}</p>
                </div>
              </div>
              <div className="flex flex-col justify-between rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" aria-hidden="true" />
                    <p className="text-sm text-gray-700">
                      The driver must present this QR code at the gate entrance. A token number will be sent to the driver's phone upon scanning.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
                    <p className="text-sm text-gray-700">
                      Keep a digital and printed copy handy to avoid delays at the security checkpoint.
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
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                  <Truck className="h-7 w-7 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Customer Gate Entry Portal</h1>
                  <p className="text-sm text-gray-500">
                    Submit driver details and documents to generate a secure entry QR code.
                  </p>
                </div>
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
                        ? 'border-blue-500 bg-blue-50'
                        : isCompleted
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Step {step.id + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-800">{step.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{step.description}</p>
                  </div>
                );
              })}
            </nav>

            <form className="space-y-8">
              {currentStep === 0 && (
                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-800">Vehicle Information</h2>
                  </div>
                  <div className="mt-6 grid gap-6">
                    <div>
                      <label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">
                        Vehicle Number<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="vehicleNumber"
                        name="vehicleNumber"
                        type="text"
                        value={formData.vehicleNumber}
                        onChange={(event) => handleInputChange('vehicleNumber', event.target.value)}
                        placeholder="Enter vehicle number"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold tracking-wide text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.vehicleNumber ? 'border-red-400 bg-red-50 placeholder:text-red-400' : 'border-gray-300 bg-white'
                        }`}
                        autoComplete="off"
                      />
                      {errors.vehicleNumber && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.vehicleNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 1 && (
                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-800">Driver Information</h2>
                  </div>
                  <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    <div>
                      <label htmlFor="driverPhone" className="text-sm font-medium text-gray-700">
                        Driver Phone Number<span className="text-red-500"> *</span>
                      </label>
                      <input
                        id="driverPhone"
                        name="driverPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.driverPhone}
                        onChange={(event) => handleInputChange('driverPhone', event.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.driverPhone ? 'border-red-400 bg-red-50 placeholder:text-red-400' : 'border-gray-300 bg-white'
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
                      <label htmlFor="helperPhone" className="text-sm font-medium text-gray-700">
                        Helper Phone Number (optional)
                      </label>
                      <input
                        id="helperPhone"
                        name="helperPhone"
                        type="tel"
                        inputMode="numeric"
                        value={formData.helperPhone}
                        onChange={(event) => handleInputChange('helperPhone', event.target.value)}
                        placeholder="+91XXXXXXXXXX"
                        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          errors.helperPhone ? 'border-red-400 bg-red-50 placeholder:text-red-400' : 'border-gray-300 bg-white'
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
                      <label htmlFor="preferredLanguage" className="text-sm font-medium text-gray-700">
                        Preferred Language<span className="text-red-500"> *</span>
                      </label>
                      <div className="relative mt-2">
                        <Globe className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                        <select
                          id="preferredLanguage"
                          name="preferredLanguage"
                          value={formData.preferredLanguage}
                          onChange={(event) => handleInputChange('preferredLanguage', event.target.value)}
                          className={`w-full appearance-none rounded-xl border bg-white px-4 py-3 pl-10 text-sm font-medium text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            errors.preferredLanguage ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        >
                          {languages.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.preferredLanguage && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="h-4 w-4" aria-hidden="true" />
                          <span>{errors.preferredLanguage}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {currentStep === 2 && (
                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    <h2 className="text-lg font-semibold text-gray-800">Document Uploads</h2>
                  </div>
                  <div className="mt-6 grid gap-6">
                    <DocumentUploadField
                      id="purchaseOrder"
                      label="Purchase Order"
                      description="Upload the latest purchase order issued for this delivery."
                      file={files.purchaseOrder}
                      onFileSelect={handleFileSelect}
                      error={errors.purchaseOrder}
                    />
                    <DocumentUploadField
                      id="vehiclePapers"
                      label="Vehicle Papers"
                      description="Include RC book, insurance, and other mandatory vehicle documents."
                      file={files.vehiclePapers}
                      onFileSelect={handleFileSelect}
                      error={errors.vehiclePapers}
                    />
                    <DocumentUploadField
                      id="aadhaarCard"
                      label="Driver Aadhaar Card"
                      description="Upload front and back of the driver’s Aadhaar card."
                      file={files.aadhaarCard}
                      onFileSelect={handleFileSelect}
                      error={errors.aadhaarCard}
                    />
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
                      ? 'cursor-not-allowed border-gray-200 text-gray-400'
                      : 'border-blue-500 text-blue-600 hover:bg-blue-50'
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
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
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
