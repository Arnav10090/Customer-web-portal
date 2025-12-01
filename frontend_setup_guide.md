Frontend Setup Guide
Prerequisites
Before setting up the frontend, ensure you have the following installed:

Node.js: v14.0.0 or higher
npm: v6.0.0 or higher (comes with Node.js)
Git: For version control

You can verify your installations by running:
bashnode --version
npm --version
Installation Steps
1. Navigate to the Frontend Directory
bashcd customer-web-portal
2. Install Dependencies
Install all required npm packages:
bashnpm install
This will install the following key dependencies:

React 19.2.0: Core framework
Tailwind CSS 3.4.14: Styling
Lucide React 0.471.0: Icon library
React Scripts 5.0.1: Build tooling

3. Environment Configuration
The React frontend uses environment variables for API configuration. However, the current implementation uses a hardcoded API base URL. For production deployments, you should create environment files.
Create a .env file in the frontend root directory:
bashtouch .env
Add the following configuration:
env# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000

# Optional: Enable/disable features
REACT_APP_ENABLE_MOCK_MODE=false
For production, create .env.production:
envREACT_APP_API_BASE_URL=https://your-production-domain.com
REACT_APP_ENABLE_MOCK_MODE=false
4. Update API Configuration (if needed)
If you're using environment variables, update the API calls in src/components/CustomerPortal.jsx:
javascriptconst API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// Example API call
const response = await fetch(`${API_BASE_URL}/api/submissions/create`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
  body: payload,
});
5. Start the Development Server
Run the development server:
bashnpm start
Or using the custom start script:
bashnpm run dev
```

The application will open automatically at:
- **Local**: http://localhost:3000
- **Network**: http://[your-ip]:3000

The custom start script (`start-server.js`) displays your local network IP for testing on mobile devices.

## Frontend Folder Structure
```
customer-web-portal/
├── public/                    # Static assets
│   ├── index.html            # HTML template
│   ├── manifest.json         # PWA manifest
│   └── robots.txt            # SEO configuration
│
├── src/                      # Source code
│   ├── components/           # React components
│   │   └── CustomerPortal.jsx  # Main application component
│   ├── App.js                # App entry point
│   ├── App.css               # App-level styles
│   ├── index.js              # React DOM render
│   ├── index.css             # Tailwind CSS imports
│   ├── setupTests.js         # Test configuration
│   └── reportWebVitals.js    # Performance monitoring
│
├── .env                      # Environment variables (local)
├── .env.production           # Environment variables (production)
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
├── postcss.config.js         # PostCSS configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── start-server.js           # Custom start script with IP display
Key Component Architecture
CustomerPortal.jsx
The main application component that handles the entire gate entry submission workflow. It's organized into several key sections:
State Management
javascript// Authentication state
const [authToken, setAuthToken] = useState(getStoredToken());

// Form data state
const [formData, setFormData] = useState({
  vehicleNumber: "",
  customerEmail: "",
  customerPhone: "",
  driverPhone: "",
  driverName: "",
  helperPhone: "",
  helperName: "",
  driverLanguage: "en",
  helperLanguage: "en",
});

// File upload state
const [files, setFiles] = useState({
  purchaseOrder: [],
  vehicleRegistration: [],
  vehicleInsurance: [],
  // ... other document types
});

// Multi-step form state
const [currentStep, setCurrentStep] = useState(0);
const [errors, setErrors] = useState({});
Form Steps
The application uses a 3-step wizard:

Step 0 - Vehicle Information

Customer email and phone
Vehicle registration number


Step 1 - Driver Information

Driver name, phone, and language preference
Helper name, phone, and language preference


Step 2 - Document Uploads

Dynamic document selection
Drag-and-drop file uploads
Multiple files per document type



Key Features
Token Management
javascript// Token storage using localStorage
const getStoredToken = () => localStorage.getItem("customerToken") || "";
const storeToken = (value) => {
  if (value) {
    localStorage.setItem("customerToken", value);
  } else {
    localStorage.removeItem("customerToken");
  }
};
Form Validation

Real-time validation with error messages
Phone number formatting: +91XXXXXXXXXX
Email validation
Vehicle number validation (uppercase, alphanumeric)
File size and type validation (PDF, JPG, JPEG, PNG up to 5MB)

File Upload Handling
javascriptconst handleFileSelect = (field, file) => {
  // Validate file
  if (!ACCEPTED_TYPES.includes(file.type)) {
    setErrors({ ...errors, [field]: "Invalid file type" });
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setErrors({ ...errors, [field]: "File too large" });
    return;
  }
  
  // Append to files array
  setFiles(prev => ({
    ...prev,
    [field]: [...(prev[field] || []), file]
  }));
};
Styling Architecture
The application uses Tailwind CSS for styling with a custom configuration.
Tailwind Configuration
javascript// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: []
};
Design System
Color Palette

Primary: Blue (blue-50 to blue-700)
Success: Green (green-50 to green-700)
Error: Red (red-50 to red-700)
Neutral: Gray (gray-50 to gray-900)

Component Patterns

Rounded corners: rounded-xl (12px)
Shadows: shadow-xl for elevated elements
Transitions: transition-all duration-200
Focus states: focus-visible:ring-2 focus-visible:ring-blue-500

Responsive Design
All components are mobile-responsive using Tailwind's responsive utilities:
javascript// Example: Responsive grid
<div className="grid gap-6 lg:grid-cols-2">
  {/* Two columns on large screens, single column on mobile */}
</div>

// Example: Responsive flex
<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
  {/* Column on mobile, row on small screens and up */}
</div>
Available Scripts
Development
bash# Start development server with custom IP display
npm start
# or
npm run dev
Production Build
bash# Create optimized production build
npm run build
Output will be in the build/ directory, ready for deployment.
Testing
bash# Run tests in interactive watch mode
npm test
Eject (Not Recommended)
bash# Eject from Create React App (one-way operation)
npm run eject
Warning: Ejecting is irreversible and gives you full control over configuration files but removes the ability to receive updates from Create React App.

Connecting Frontend to Backend
API Architecture Overview
The frontend communicates with the Django REST API backend using the native fetch API. All API requests require JWT authentication via Bearer tokens.
API Base URL Configuration
Development Environment
javascript// Current hardcoded configuration in CustomerPortal.jsx
const API_ENDPOINT = '/api/submissions/create';

// For local development, requests go to:
// http://localhost:3000/api/submissions/create
// which proxies to http://localhost:8000/api/submissions/create
Recommended Configuration with Environment Variables
javascript// Add to CustomerPortal.jsx or create a separate API service file
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

// API endpoints
const ENDPOINTS = {
  submissions: {
    create: `${API_BASE_URL}/api/submissions/create`,
  },
  auth: {
    login: `${API_BASE_URL}/api/auth/login/`,
    register: `${API_BASE_URL}/api/auth/register/`,
    logout: `${API_BASE_URL}/api/auth/logout/`,
    refresh: `${API_BASE_URL}/api/auth/token/refresh/`,
  },
  vehicles: {
    lookup: (vehicleNumber) => `${API_BASE_URL}/api/vehicles/${vehicleNumber}/lookup/`,
  },
  drivers: {
    validateOrCreate: `${API_BASE_URL}/api/drivers/validate-or-create/`,
  },
  documents: {
    upload: `${API_BASE_URL}/api/documents/upload/`,
    list: (customerEmail) => `${API_BASE_URL}/api/documents/list/?customer_email=${customerEmail}`,
    download: (id) => `${API_BASE_URL}/api/documents/${id}/download/`,
  },
};
JWT Authentication Implementation
Token Storage
javascript// Token management using localStorage
const getStoredToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("customerToken") || "";
};

const storeToken = (value) => {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem("customerToken", value);
  } else {
    localStorage.removeItem("customerToken");
  }
};

// Initialize token state
const [authToken, setAuthToken] = useState(getStoredToken());
Authenticated API Requests
javascript// Example: Submission request with JWT authentication
const handleSubmit = async () => {
  if (!authToken) {
    setSubmitError("Authentication token is missing. Please sign in again.");
    return;
  }

  const payload = new FormData();
  // ... populate form data

  try {
    const response = await fetch("/api/submissions/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Note: Don't set Content-Type for FormData; browser sets it automatically
      },
      body: payload,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        setSubmitError("Session expired. Please log in again.");
        handleTokenClear();
        return;
      }
      throw new Error("Submission failed");
    }

    const data = await response.json();
    // Process response
  } catch (error) {
    setSubmitError(error.message);
  }
};
```

## API Request/Response Examples

### 1. Create Submission

**Endpoint**: `POST /api/submissions/create/`

**Request Headers**:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data
Request Body (FormData):
javascriptconst formData = new FormData();
formData.append("customerEmail", "customer@example.com");
formData.append("customerPhone", "+919876543210");
formData.append("vehicleNumber", "MH12AB1234");
formData.append("driverName", "John Doe");
formData.append("driverPhone", "+919876543211");
formData.append("driverLanguage", "en");
formData.append("helperName", "Jane Smith");
formData.append("helperPhone", "+919876543212");
formData.append("helperLanguage", "hi");

// Append document files
formData.append("purchase_order", purchaseOrderFile);
formData.append("vehicle_registration", vehicleRegFile);
formData.append("vehicle_insurance", vehicleInsFile);
formData.append("puc", pucFile);
formData.append("driver_license", driverLicenseFile);
// ... other documents
Success Response (201 Created):
json{
  "submission": {
    "id": 1,
    "qrCodeImage": "http://localhost:8000/media/qr_codes/qr_MH12AB1234.png",
    "vehicleNumber": "MH12AB1234",
    "driverPhone": "+919876543211",
    "status": "pending",
    "createdAt": "2024-12-01T10:30:00Z"
  }
}
Error Response (400 Bad Request):
json{
  "error": "Driver phone number validation failed: phone already registered with different name"
}
Error Response (401 Unauthorized):
json{
  "detail": "Authentication credentials were not provided."
}
```

### 2. Vehicle Lookup (Auto-prefill)

**Endpoint**: `GET /api/vehicles/{vehicle_registration_no}/lookup/`

**Request Headers**:
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Success Response (200 OK):
json{
  "vehicle": {
    "id": 1,
    "vehicle_registration_no": "MH12AB1234",
    "remark": "",
    "ratings": 0,
    "created": "2024-11-01T08:00:00Z"
  },
  "driver": {
    "id": 1,
    "name": "John Doe",
    "type": "Driver",
    "phone_no": "+919876543211",
    "language": "en",
    "is_blacklisted": false,
    "rating": 0
  },
  "helper": {
    "id": 2,
    "name": "Jane Smith",
    "type": "Helper",
    "phone_no": "+919876543212",
    "language": "hi",
    "is_blacklisted": false,
    "rating": 0
  },
  "documents": [
    {
      "id": 1,
      "document_type": "purchase_order",
      "document_type_display": "Purchase Order",
      "original_filename": "PO_12345.pdf",
      "file_size": 1048576,
      "uploaded_at": "2024-11-15T09:00:00Z"
    }
  ]
}
3. Driver/Helper Validation
Endpoint: POST /api/drivers/validate-or-create/
Request Body:
json{
  "name": "John Doe",
  "phone_no": "+919876543211",
  "type": "Driver",
  "language": "en"
}
Success Response (200 OK - Existing driver):
json{
  "driver": {
    "id": 1,
    "name": "John Doe",
    "type": "Driver",
    "phone_no": "+919876543211",
    "language": "en",
    "is_blacklisted": false,
    "rating": 0,
    "created": "2024-10-01T08:00:00Z"
  },
  "created": false,
  "message": "Existing driver/helper found"
}
Success Response (201 Created - New driver):
json{
  "driver": {
    "id": 2,
    "name": "Jane Smith",
    "type": "Helper",
    "phone_no": "+919876543212",
    "language": "hi",
    "is_blacklisted": false,
    "rating": 0,
    "created": "2024-12-01T10:30:00Z"
  },
  "created": true,
  "message": "New driver/helper created"
}
Error Response (400 Bad Request):
json{
  "error": "Phone number +919876543211 is already registered with name 'John Doe'. Cannot register as 'Jonathan Doe'."
}
4. Document Upload
Endpoint: POST /api/documents/upload/
Request Body (FormData):
javascriptconst formData = new FormData();
formData.append("customer_email", "customer@example.com");
formData.append("document_type", "purchase_order");
formData.append("file", file);
formData.append("vehicle_id", "1");
formData.append("driver_id", "1");
Success Response (201 Created):
json{
  "document": {
    "id": 1,
    "customer_email": "customer@example.com",
    "document_type": "purchase_order",
    "document_type_display": "Purchase Order",
    "file_path": "/var/customer_portal/documents/customer_at_example_com/purchase_order/purchase_order_20241201_103000.pdf",
    "original_filename": "PO_12345.pdf",
    "file_size": 1048576,
    "file_size_readable": "1.00 MB",
    "file_extension": ".pdf",
    "file_exists": true,
    "uploaded_at": "2024-12-01T10:30:00Z"
  },
  "replaced": false,
  "message": "Document uploaded successfully",
  "storage_path": "/var/customer_portal/documents/customer_at_example_com/purchase_order/purchase_order_20241201_103000.pdf"
}
CORS Configuration
The Django backend must be configured to accept requests from the React frontend.
Backend CORS Settings
In customer-portal-backend/customer_portal/settings.py:
python# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.100:3000",  # Add your network IP
]

CORS_ALLOW_CREDENTIALS = True

# For development only - allow all origins (not recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True
Frontend Proxy Configuration (Development)
For development, you can add a proxy in package.json:
json{
  "proxy": "http://localhost:8000"
}
This allows the frontend to make requests to /api/... without specifying the full backend URL.
CSRF Token Handling
Django REST Framework with JWT authentication typically doesn't require CSRF tokens for API endpoints. However, if you're using session authentication alongside JWT:
javascript// Get CSRF token from cookie
const getCsrfToken = () => {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
};

// Include in request headers
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-CSRFToken': getCsrfToken(),
  },
  body: formData,
});
Error Handling Best Practices
javascriptconst handleApiError = async (response) => {
  if (!response.ok) {
    let errorMessage = "An error occurred. Please try again.";
    
    try {
      const errorData = await response.json();
      if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.detail) {
        errorMessage = errorData.detail;
      }
    } catch (parseError) {
      // Response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        storeToken("");
        setAuthToken("");
        errorMessage = "Session expired. Please log in again.";
        break;
      case 403:
        errorMessage = "You don't have permission to perform this action.";
        break;
      case 404:
        errorMessage = "The requested resource was not found.";
        break;
      case 500:
        errorMessage = "Server error. Please try again later.";
        break;
    }

    throw new Error(errorMessage);
  }
};

// Usage
try {
  const response = await fetch(endpoint, options);
  await handleApiError(response);
  const data = await response.json();
  // Process data
} catch (error) {
  setSubmitError(error.message);
}
Token Refresh Strategy (Future Enhancement)
The current implementation uses long-lived access tokens stored in localStorage. For improved security, implement token refresh:
javascript// Refresh token before expiry
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("/api/auth/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Token refresh failed");
  }

  const data = await response.json();
  storeToken(data.access);
  setAuthToken(data.access);
  
  return data.access;
};

// Use in API interceptor
const authenticatedFetch = async (url, options = {}) => {
  try {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      },
    });

    // If unauthorized, try refreshing token
    if (response.status === 401) {
      const newToken = await refreshAccessToken();
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }

    return response;
  } catch (error) {
    // Refresh failed, redirect to login
    handleTokenClear();
    throw error;
  }
};

Application Workflow Mapping
This section maps the complete application workflow from the requirements document to the actual implementation, showing how each step flows through frontend components, backend APIs, and database operations.
Overview of Workflow Steps
Based on the Customer Web Portal Web app workflow.docx:

Automatic Prefill on Entering Vehicle Registration Number
Driver and Helper Selection with Validation
Customer Document Management
QR Code Generation and Notification Workflow
Database Update & Logging

Step 1: Automatic Prefill on Vehicle Registration
Frontend Implementation
Component: CustomerPortal.jsx - Step 0 (Vehicle Information)
User Action: Customer enters vehicle registration number
Frontend Flow:
javascript// Step 0: Vehicle number input
<input
  id="vehicleNumber"
  value={formData.vehicleNumber}
  onChange={(e) => handleInputChange("vehicleNumber", e.target.value)}
  // Formats to uppercase, alphanumeric only
/>
Auto-prefill Trigger (To be implemented):
javascript// Add useEffect to fetch vehicle data when vehicle number is entered
useEffect(() => {
  const fetchVehicleData = async () => {
    if (formData.vehicleNumber.length >= 6) { // Minimum valid vehicle number length
      try {
        const response = await fetch(
          `/api/vehicles/${formData.vehicleNumber}/lookup/`,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Auto-populate driver data
          if (data.driver) {
            setFormData(prev => ({
              ...prev,
              driverName: data.driver.name,
              driverPhone: data.driver.phone_no,
              driverLanguage: data.driver.language,
            }));
          }
          
          // Auto-populate helper data
          if (data.helper) {
            setFormData(prev => ({
              ...prev,
              helperName: data.helper.name,
              helperPhone: data.helper.phone_no,
              helperLanguage: data.helper.language,
            }));
          }
          
          // Auto-populate documents (show as already uploaded)
          if (data.documents && data.documents.length > 0) {
            // Display existing documents or pre-populate file list
            setExistingDocuments(data.documents);
          }
        }
      } catch (error) {
        console.error("Vehicle lookup failed:", error);
      }
    }
  };

  const debounceTimer = setTimeout(fetchVehicleData, 500);
  return () => clearTimeout(debounceTimer);
}, [formData.vehicleNumber, authToken]);
Backend API
Endpoint: GET /api/vehicles/{vehicle_registration_no}/lookup/
Django View: vehicles/views.py - VehicleViewSet.lookup_vehicle()
Implementation:
python@action(detail=True, methods=['get'], url_path='lookup')
def lookup_vehicle(self, request, vehicle_registration_no=None):
    """
    Auto-fill workflow: Fetch vehicle, driver, helper, and documents
    """
    try:
        vehicle = self.get_object()
    except VehicleDetails.DoesNotExist:
        return Response(
            {"detail": "Vehicle not found"},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get latest submission for this vehicle
    latest_submission = vehicle.submissions.order_by('-created_at').first()

    driver_data = None
    helper_data = None
    documents_data = []

    if latest_submission:
        if latest_submission.driver:
            driver_data = DriverHelperSerializer(latest_submission.driver).data
        if latest_submission.helper:
            helper_data = DriverHelperSerializer(latest_submission.helper).data

        # Get documents for this customer
        documents = CustomerDocument.objects.filter(
            customer_email=latest_submission.customer_email,
            is_active=True
        )
        documents_data = CustomerDocumentSerializer(documents, many=True).data

    return Response({
        "vehicle": VehicleDetailsSerializer(vehicle).data,
        "driver": driver_data,
        "helper": helper_data,
        "documents": documents_data
    })
Database Tables Involved
Tables:

VehicleDetails: Primary lookup by vehicle_registration_no
GateEntrySubmission: Find latest submission for vehicle
DriverHelper: Retrieve associated driver and helper records
CustomerDocument: Fetch previously uploaded documents

Query Flow:

Look up vehicle by registration number
Get latest submission for that vehicle (ordered by created_at DESC)
Fetch driver and helper via foreign keys
Query documents by customer email and is_active=True


Step 2: Driver and Helper Selection with Validation
Frontend Implementation
Component: CustomerPortal.jsx - Step 1 (Driver Information)
User Actions:

Enter driver name and phone number
Enter helper name and phone number
Select language preferences

Frontend Validation:
javascript// Phone number validation
const validatePhone = (value, label) => {
  if (!value) return `${label} is required.`;
  if (!/^\+91\d{10}$/.test(value)) {
    return `${label} must follow +91XXXXXXXXXX format.`;
  }
  return "";
};

// Name validation
if (!formData.driverName || formData.driverName.trim().length < 2) {
  validationErrors.driverName = "Driver name must be at least 2 characters.";
}
Phone Number Formatting:
javascriptconst formatPhoneValue = (value) => {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  
  const withoutCountry = digits.startsWith("91") ? digits.slice(2) : digits;
  const trimmed = withoutCountry.slice(0, 10);
  return trimmed ? `+91${trimmed}` : "";
};
Backend API
Endpoint: POST /api/drivers/validate-or-create/
Django View: drivers/views.py - DriverHelperViewSet.validate_or_create()
Implementation:
python@action(detail=False, methods=['post'], url_path='validate-or-create')
def validate_or_create(self, request):
    """
    Validate phone uniqueness and create if needed
    """
    serializer = DriverHelperValidateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    name = serializer.validated_data['name']
    phone_no = serializer.validated_data['phone_no']
    driver_type = serializer.validated_data['type']
    language = serializer.validated_data.get('language', 'en')

    try:
        instance, created = DriverHelper.validate_or_create(
            name=name,
            phone_no=phone_no,
            driver_type=driver_type,
            language=language
        )

        message = "New driver/helper created" if created else "Existing driver/helper found"

        return Response({
            "driver": DriverHelperSerializer(instance).data,
            "created": created,
            "message": message
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    except ValidationError as e:
        return Response({
            "error": str(e.message)
        }, status=status.HTTP_400_BAD_REQUEST)
Validation Logic (Model Level)
Model: drivers/models.py - DriverHelper
Validation Method:
python@classmethod
def validate_or_create(cls, name, phone_no, driver_type, language='en'):
    """
    Workflow validation logic:
    - If phone exists and name matches → return existing
    - If phone exists but name mismatch → raise error
    - If phone doesn't exist → create new
    """
    try:
        existing = cls.objects.get(phone_no=phone_no)
        
        # Name matches (case-insensitive)
        if existing.name.lower() == name.lower():
            # Update language if changed
            if existing.language != language:
                existing.language = language
                existing.save()
            return existing, False  # (instance, created)
        else:
            # Name mismatch - raise error
            raise ValidationError(
                f"Phone number {phone_no} is already registered with name '{existing.name}'. "
                f"Cannot register as '{name}'."
            )
    except cls.DoesNotExist:
        # Create new driver/helper
        instance = cls.objects.create(
            name=name,
            phone_no=phone_no,
            type=driver_type,
            language=language
        )
        return instance, True  # (instance, created)
Database Tables Involved
Table: DriverHelper
**ValidationAContinueQuery**:
sql-- Check if phone exists
SELECT * FROM "DriverHelper" WHERE phone_no = '+919876543211';

-- If exists, compare name (case-insensitive)
SELECT * FROM "DriverHelper" 
WHERE phone_no = '+919876543211' 
AND LOWER(name) = LOWER('John Doe');

-- If doesn't exist, insert new record
INSERT INTO "DriverHelper" (name, type, phone_no, language, is_blacklisted, rating, created, updated)
VALUES ('John Doe', 'Driver', '+919876543211', 'en', false, 0, NOW(), NOW());
Unique Constraint: phone_no field has a unique constraint to prevent duplicate phone numbers.

Step 3: Customer Document Management
Frontend Implementation
Component: CustomerPortal.jsx - Step 2 (Document Uploads)
User Actions:

Select document type from dropdown
Drag-and-drop or browse to select file
Upload file (replaces existing document of same type)
Remove uploaded documents if needed

Document Selection Dropdown:
javascriptconst documentOptions = [
  { id: "purchaseOrder", label: "Purchase Order (PO)" },
  { id: "vehicleRegistration", label: "Vehicle Registration" },
  { id: "vehicleInsurance", label: "Vehicle Insurance" },
  { id: "puc", label: "PUC" },
  { id: "driverLicense", label: "Driver License" },
  { id: "transportationApproval", label: "Transportation Approval" },
  { id: "paymentApproval", label: "Payment Approval" },
  { id: "vendorApproval", label: "Vendor Approval" },
];

// Dropdown state
const [selectedDocType, setSelectedDocType] = useState(documentOptions[0].id);
const [stagedFile, setStagedFile] = useState(null);
File Upload Handler:
javascriptconst handleUploadStaged = () => {
  if (!stagedFile) {
    setErrors({ ...errors, staged: "No file selected to upload." });
    return;
  }
  
  // Append to files array (allows multiple files per type)
  setFiles(prev => ({
    ...prev,
    [selectedDocType]: [...(prev[selectedDocType] || []), stagedFile]
  }));
  
  setStagedFile(null);
  clearFieldError(selectedDocType);
};
File Validation:
javascriptconst MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
];

const validateFile = (file, label) => {
  if (!file) return `${label} is required.`;
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${label} must be a PDF, JPG, JPEG, or PNG file.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${label} must be 5MB or smaller.`;
  }
  return "";
};
Backend API
Endpoint: POST /api/documents/upload/
Django View: documents/views.py - CustomerDocumentViewSet.upload_document()
Implementation:
python@action(detail=False, methods=['post'], url_path='upload')
def upload_document(self, request):
    """
    Upload or replace document
    File is saved to computer storage, path stored in database
    """
    serializer = DocumentUploadSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    customer_email = serializer.validated_data['customer_email']
    document_type = serializer.validated_data['document_type']
    uploaded_file = serializer.validated_data['file']
    vehicle_id = serializer.validated_data.get('vehicle_id')
    driver_id = serializer.validated_data.get('driver_id')

    # Get vehicle and driver objects
    vehicle = None
    driver = None
    if vehicle_id:
        try:
            vehicle = VehicleDetails.objects.get(id=vehicle_id)
        except VehicleDetails.DoesNotExist:
            pass

    if driver_id:
        try:
            driver = DriverHelper.objects.get(id=driver_id)
        except DriverHelper.DoesNotExist:
            pass

    # Check if document exists (for replacement)
    existing = CustomerDocument.objects.filter(
        customer_email=customer_email,
        document_type=document_type,
        is_active=True
    ).first()

    replaced = bool(existing)

    try:
        # Replace or create - saves file to storage and stores path in DB
        new_doc = CustomerDocument.replace_document(
            customer_email=customer_email,
            document_type=document_type,
            uploaded_file=uploaded_file,
            vehicle=vehicle,
            driver=driver
        )

        return Response({
            "document": CustomerDocumentSerializer(new_doc, context={'request': request}).data,
            "replaced": replaced,
            "message": "Document replaced successfully" if replaced else "Document uploaded successfully",
            "storage_path": new_doc.file_path
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            "error": f"Failed to save document: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
Document Storage Logic
Model: documents/models.py - CustomerDocument
File Storage Method:
python@classmethod
def save_file_to_storage(cls, uploaded_file, customer_email, document_type):
    """
    Save uploaded file to local storage and return file path
    """
    # Get storage directory
    storage_dir = cls.get_storage_path(customer_email, document_type)
    
    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_extension = os.path.splitext(uploaded_file.name)[1]
    filename = f"{document_type}_{timestamp}{file_extension}"
    
    # Full file path
    file_path = os.path.join(storage_dir, filename)
    
    # Save file to disk
    with open(file_path, 'wb+') as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)
    
    return {
        'file_path': file_path,
        'original_filename': uploaded_file.name,
        'file_size': uploaded_file.size,
        'file_extension': file_extension
    }
Document Replacement Logic:
python@classmethod
def replace_document(cls, customer_email, document_type, uploaded_file, vehicle=None, driver=None):
    """
    Replace old document with new one:
    - Save new file to storage
    - Mark old document as inactive
    - Create new document record with file path
    - Link via replaced_by
    """
    # Find existing active document
    old_doc = cls.objects.filter(
        customer_email=customer_email,
        document_type=document_type,
        is_active=True
    ).first()

    # Save file to storage and get file info
    file_info = cls.save_file_to_storage(uploaded_file, customer_email, document_type)

    # Create new document record
    new_doc = cls.objects.create(
        customer_email=customer_email,
        document_type=document_type,
        file_path=file_info['file_path'],
        original_filename=file_info['original_filename'],
        file_size=file_info['file_size'],
        file_extension=file_info['file_extension'],
        vehicle=vehicle,
        driver=driver
    )

    # Mark old document as replaced (soft delete)
    if old_doc:
        old_doc.is_active = False
        old_doc.replaced_by = new_doc
        old_doc.save()

    return new_doc
Database Tables Involved
Table: CustomerDocument
Fields:

customer_email: Lookup key for customer's documents
document_type: Type of document (e.g., 'purchase_order')
file_path: Absolute path to file on storage
original_filename: Original name of uploaded file
file_size: Size in bytes
file_extension: File extension (.pdf, .jpg, etc.)
is_active: Boolean flag (soft delete)
replaced_by: Foreign key to replacement document

Document Lifecycle Query:
sql-- Check for existing active document
SELECT * FROM "CustomerDocument"
WHERE customer_email = 'customer@example.com'
AND document_type = 'purchase_order'
AND is_active = true;

-- Create new document
INSERT INTO "CustomerDocument" 
(customer_email, document_type, file_path, original_filename, file_size, file_extension, is_active, uploaded_at, updated_at)
VALUES 
('customer@example.com', 'purchase_order', '/var/.../PO_20241201.pdf', 'PO_12345.pdf', 1048576, '.pdf', true, NOW(), NOW());

-- Mark old document as replaced
UPDATE "CustomerDocument"
SET is_active = false, replaced_by_id = 2
WHERE id = 1;
```

**File Storage Structure**:
```
/var/customer_portal/documents/
├── customer_at_example_com/
│   ├── purchase_order/
│   │   ├── purchase_order_20241201_103000.pdf
│   │   └── purchase_order_20241201_143000.pdf
│   ├── vehicle_registration/
│   │   └── vehicle_registration_20241201_103000.pdf
│   └── driver_license/
│       └── driver_license_20241201_103000.pdf

Step 4: QR Code Generation and Notification Workflow
Frontend Implementation
Component: CustomerPortal.jsx - Final Submission
User Action: Click "Submit Entry" button
Frontend Submission Flow:
javascriptconst handleSubmit = async () => {
  // 1. Validate authentication
  if (!authToken) {
    setSubmitError("Authentication token is missing.");
    return;
  }

  // 2. Validate all form data
  if (!validateAll()) {
    setSubmitError("Please fix errors before submitting.");
    return;
  }

  setLoading(true);

  // 3. Prepare FormData payload
  const payload = new FormData();
  payload.append("customerEmail", formData.customerEmail.trim());
  payload.append("customerPhone", formData.customerPhone);
  payload.append("vehicleNumber", formData.vehicleNumber.trim());
  payload.append("driverName", formData.driverName.trim());
  payload.append("driverPhone", formData.driverPhone);
  payload.append("driverLanguage", formData.driverLanguage);
  payload.append("helperName", formData.helperName.trim());
  payload.append("helperPhone", formData.helperPhone);
  payload.append("helperLanguage", formData.helperLanguage);

  // 4. Append all document files
  Object.entries(files).forEach(([key, arrOrFile]) => {
    if (!arrOrFile) return;
    const apiKey = key; // Map to backend field names if needed
    if (Array.isArray(arrOrFile)) {
      arrOrFile.forEach((file) => payload.append(apiKey, file));
    } else {
      payload.append(apiKey, arrOrFile);
    }
  });

  try {
    // 5. Send submission request
    const response = await fetch("/api/submissions/create", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error("Submission failed");
    }

    // 6. Process response
    const data = await response.json();
    const submission = data?.submission;

    // 7. Display success with QR code
    setSuccessData({
      qrCodeImage: submission.qrCodeImage,
      vehicleNumber: submission.vehicleNumber,
      driverPhone: formData.driverPhone,
    });
    setShowNotify(true);

  } catch (error) {
    setSubmitError(error.message);
  } finally {
    setLoading(false);
  }
};
Success Display:
javascript// QR Code Success Screen
if (successData) {
  return (
    <div className="success-screen">
      {/* Toast notification */}
      <div className="notification">
        QR code link emailed on {formData.customerEmail}
        and mobile number: {formData.customerPhone}
      </div>

      {/* QR Code Display */}
      <img src={successData.qrCodeImage} alt="Entry QR Code" />
      <p>Vehicle: {successData.vehicleNumber}</p>
      <p>Driver: {successData.driverPhone}</p>

      {/* Actions */}
      <button onClick={handleDownloadQr}>Download QR Code</button>
      <button onClick={resetForm}>Submit Another Entry</button>
    </div>
  );
}
Backend API
Endpoint: POST /api/submissions/create/
Django View: submissions/views.py - GateEntrySubmissionViewSet.create_submission()
Complete Implementation Flow:
python@action(detail=False, methods=['post'], url_path='create')
def create_submission(self, request):
    """
    Create gate entry submission with QR code generation
    """
    serializer = SubmissionCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        with transaction.atomic():
            # Extract data
            customer_email = serializer.validated_data['customer_email']
            customer_phone = serializer.validated_data['customer_phone']
            vehicle_number = serializer.validated_data['vehicle_number']
            driver_name = serializer.validated_data['driver_name']
            driver_phone = serializer.validated_data['driver_phone']
            driver_language = serializer.validated_data.get('driver_language', 'en')
            helper_name = serializer.validated_data.get('helper_name')
            helper_phone = serializer.validated_data.get('helper_phone')
            helper_language = serializer.validated_data.get('helper_language', 'en')

            # 1. Get or create vehicle
            vehicle, _ = VehicleDetails.objects.get_or_create(
                vehicle_registration_no=vehicle_number.upper()
            )

            # 2. Validate or create driver
            driver, driver_created = DriverHelper.validate_or_create(
                name=driver_name,
                phone_no=driver_phone,
                driver_type='Driver',
                language=driver_language
            )

            # 3. Validate or create helper (if provided)
            helper = None
            if helper_name and helper_phone:
                helper, helper_created = DriverHelper.validate_or_create(
                    name=helper_name,
                    phone_no=helper_phone,
                    driver_type='Helper',
                    language=helper_language
                )

            # 4. Create submission (without QR yet)
            submission = GateEntrySubmission.objects.create(
                customer_email=customer_email,
                customer_phone=customer_phone,
                vehicle=vehicle,
                driver=driver,
                helper=helper
            )

            # 5. Generate QR payload hash
            submission.qr_payload_hash = submission.generate_payload_hash()

            # 6. Generate QR code
            qr_payload = {
                'submission_id': submission.id,
                'customer_name': customer_email.split('@')[0],
                'customer_email': customer_email,
                'driver_name': driver.name,
                'driver_phone': driver.phone_no,
                'helper_name': helper.name if helper else '',
                'helper_phone': helper.phone_no if helper else '',
                'vehicle_number': vehicle.vehicle_registration_no,
                'timestamp': submission.created_at.isoformat(),
            }
            
            qr_file = generate_qr_code(qr_payload)
            submission.qr_code_image = qr_file
            submission.save()

            # 7. Handle document uploads
            document_fields = [
                'purchase_order', 'vehicle_registration', 'vehicle_insurance',
                'puc', 'driver_license', 'transportation_approval',
                'payment_approval', 'vendor_approval'
            ]

            for field in document_fields:
                file = request.FILES.get(field)
                if file:
                    CustomerDocument.replace_document(
                        customer_email=customer_email,
                        document_type=field,
                        new_file=file,
                        vehicle=vehicle,
                        driver=driver
                    )

            # 8. Create audit log
            AuditLog.objects.create(
                submission=submission,
                action='SUBMISSION_CREATED',
                description=f'Gate entry submission created for vehicle {vehicle.vehicle_registration_no}',
                user_email=customer_email,
                ip_address=self.get_client_ip(request)
            )

            # 9. Send email notification
            self.send_qr_email(submission)

            # 10. Send SMS notification
            self.send_qr_sms(submission)

            # Return response
            return Response({
                "submission": {
                    "id": submission.id,
                    "qrCodeImage": request.build_absolute_uri(submission.qr_code_image.url),
                    "vehicleNumber": submission.vehicle.vehicle_registration_no,
                    "driverPhone": submission.driver.phone_no,
                    "status": submission.status,
                    "createdAt": submission.created_at
                }
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            "error": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
QR Code Generation
Module: submissions/qr_generator.py
pythonimport qrcode
from io import BytesIO
from django.core.files import File
import json

def generate_qr_code(payload_data):
    """
    Generate QR code image from payload data
    """
    # Create JSON string from payload
    payload_json = json.dumps(payload_data, indent=2)
    
    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(payload_json)
    qr.make(fit=True)
    
    # Create image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save to BytesIO
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    # Convert to Django File
    filename = f"qr_{payload_data.get('vehicle_number', 'code')}.png"
    return File(buffer, name=filename)
Email Notification
Method: submissions/views.py - send_qr_email()
pythondef send_qr_email(self, submission):
    """
    Send QR code via email
    """
    try:
        subject = f"Gate Entry QR Code - {submission.vehicle.vehicle_registration_no}"
        body = f"""
Dear Customer,

Your gate entry QR code has been generated successfully.

Vehicle Number: {submission.vehicle.vehicle_registration_no}
Driver: {submission.driver.name} ({submission.driver.phone_no})
{'Helper: ' + submission.helper.name + ' (' + submission.helper.phone_no + ')' if submission.helper else ''}

Please present this QR code at the gate entrance.

Best regards,
Gate Entry System
        """

        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.EMAIL_HOST_USER,
            to=[submission.customer_email],
        )

        # Attach QR code
        if submission.qr_code_image:
            email.attach_file(submission.qr_code_image.path)

        email.send(fail_silently=False)

        # Log email sent
        AuditLog.objects.create(
            submission=submission,
            action='EMAIL_SENT',
            description=f'QR code email sent to {submission.customer_email}',
            user_email=submission.customer_email
        )

    except Exception as e:
        # Log error but don't fail the submission
        AuditLog.objects.create(
            submission=submission,
            action='EMAIL_FAILED',
            description=f'Failed to send email: {str(e)}',
            user_email=submission.customer_email
        )
SMS Notification (Placeholder)
Method: submissions/views.py - send_qr_sms()
pythondef send_qr_sms(self, submission):
    """
    Send QR code link via SMS (placeholder implementation)
    """
    try:
        message = f"Gate Entry QR Code generated for vehicle {submission.vehicle.vehicle_registration_no}. " \
                  f"Check your email for details."
        
        # TODO: Implement actual SMS sending
        # Example: Twilio, AWS SNS, or other SMS provider
        # sms_service.send(to=submission.customer_phone, message=message)

        # Log SMS attempt
        AuditLog.objects.create(
            submission=submission,
            action='SMS_QUEUED',
            description=f'SMS queued for {submission.customer_phone}',
            user_email=submission.customer_email
        )

    except Exception as e:
        AuditLog.objects.create(
            submission=submission,
            action='SMS_FAILED',
            description=f'Failed to send SMS: {str(e)}',
            user_email=submission.customer_email
        )
Database Tables Involved
Tables Created/Updated:

VehicleDetails: Get or create vehicle record
DriverHelper: Validate or create driver and helper records
GateEntrySubmission: Main submission record with QR code
CustomerDocument: Store document file paths
AuditLog: Log all actions (submission created, email sent, etc.)

QR Code Payload Hash:
pythondef generate_payload_hash(self):
    """
    Generate SHA-256 hash of QR payload for uniqueness
    """
    payload = {
        'customer_name': self.customer_email.split('@')[0],
        'customer_email': self.customer_email,
        'driver_name': self.driver.name,
        'driver_phone': self.driver.phone_no,
        'helper_name': self.helper.name if self.helper else '',
        'helper_phone': self.helper.phone_no if self.helper else '',
        'vehicle_number': self.vehicle.vehicle_registration_no,
        'timestamp': self.created_at.isoformat() if self.created_at else '',
    }
    payload_str = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(payload_str.encode()).hexdigest()

Step 5: Database Update & Logging
Complete Database Flow
Transaction Sequence (using Django's transaction.atomic()):
pythonwith transaction.atomic():
    # 1. Vehicle record (get or create)
    vehicle, created = VehicleDetails.objects.get_or_create(
        vehicle_registration_no=vehicle_number.upper()
    )
    
    # 2. Driver record (validate or create)
    driver, driver_created = DriverHelper.validate_or_create(...)
    
    # 3. Helper record (validate or create, optional)
    helper, helper_created = DriverHelper.validate_or_create(...)
    
    # 4. Submission record
    submission = GateEntrySubmission.objects.create(
        customer_email=customer_email,
        customer_phone=customer_phone,
        vehicle=vehicle,
        driver=driver,
        helper=helper,
        qr_payload_hash=generated_hash,
        qr_code_image=qr_file,
        status='pending'
    )
    
    # 5. Document records (for each uploaded file)
    for file in uploaded_files:
        CustomerDocument.replace_document(
            customer_email=customer_email,
            document_type=file_type,
            uploaded_file=file,
            vehicle=vehicle,
            driver=driver
        )
    
    # 6. Audit log entries
    AuditLog.objects.create(
        submission=submission,
        action='SUBMISSION_CREATED',
        description=f'Gate entry submission created',
        user_email=customer_email,
        ip_address=client_ip,
        timestamp=datetime.now()
    )
Audit Log Events
Tracked Events:

SUBMISSION_CREATED: Initial submission creation
EMAIL_SENT: QR code email successfully sent
EMAIL_FAILED: Email sending failed
SMS_QUEUED: SMS queued for delivery
SMS_FAILED: SMS sending failed
DOCUMENT_UPLOADED: New document uploaded
DOCUMENT_REPLACED: Existing document replaced

Audit Log Schema:
sqlCREATE TABLE "AuditLog" (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES "GateEntrySubmission"(id),
  action VARCHAR(100),
  description TEXT,
  user_email VARCHAR(254),
  ip_address INET,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Complete Data Flow Summary
```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│  Step 0: Vehicle Info → Step 1: Driver Info → Step 2: Docs     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ POST /api/submissions/create
                             │ (FormData with files + auth token)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Django REST)                       │
│                                                                 │
│  1. Authenticate request (JWT)                                  │
│  2. Validate form data (serializer)                             │
│  3. Start database transaction                                  │
│     ├─ Get/Create Vehicle                                       │
│     ├─ Validate/Create Driver                                   │
│     ├─ Validate/Create Helper                                   │
│     ├─ Create Submission record                                 │
│     ├─ Generate QR code & hash                                  │
│     ├─ Save document files to storage                           │
│     ├─ Create document records in DB                            │
│     └─ Create audit log entries                                 │
│  4. Commit transaction                                          │
│  5. Send email with QR code                                     │
│  6. Send SMS notification                                       │
│  7. Return success response                                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ 201 Created + QR code URL
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React)                            │
│  Display success screen with QR code                            │
│  Show toast notification                                        │
│  Provide download button                                        │
│  Offer "Submit Another Entry" option                            │
└─────────────────────────────────────────────────────────────────┘
```

---

# Deployment Guide

## Production Deployment Architecture
```
┌──────────────────┐
│   Nginx/Apache   │  ← Web server (reverse proxy + static files)
│   Port 80/443    │
└────────┬─────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│  React Build    │  │  Django + Gunicorn│
│  Static Files   │  │  Port 8000        │
│  (HTML/CSS/JS)  │  │  (API Backend)    │
└─────────────────┘  └────────┬──────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  PostgreSQL DB  │
                     │  Port 5432      │
                     └─────────────────┘