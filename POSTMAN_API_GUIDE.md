# Customer Portal Backend API - Postman Guide

This guide documents all available API endpoints for the Customer Portal Backend. Use this with the provided Postman collection to test and integrate with the API.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Vehicles](#vehicles)
4. [Drivers](#drivers)
5. [Documents](#documents)
6. [Submissions](#submissions)
7. [Environment Variables](#environment-variables)
8. [Error Handling](#error-handling)

---

## Getting Started

### Prerequisites
- Backend server running on `http://localhost:8000`
- Postman installed
- Postman collection file imported: `Postman_API_Collection.json`

### Base URL
```
http://localhost:8000
```

### Starting the Backend Server
From the `customer-portal-backend` directory:
```bash
python manage.py migrate
python manage.py runserver
```

---

## Authentication

All endpoints (except Register and Login) require a valid JWT access token in the `Authorization` header:
```
Authorization: Bearer <access_token>    
```

### 1. Register
**Endpoint:** `POST /api/auth/register/`

**Description:** Register a new customer account

**Request Body:**
```json
{
  "email": "customer1@example.com",
  "username": "customer1",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "phone": "+919876543210",
  "company_name": "ABC Corporation"
}
```

**Required Fields:**
- `email`: Valid email address (must be unique)
- `username`: Username (must be unique)
- `password`: Strong password (validated)
- `password2`: Password confirmation (must match password)
- `phone`: Phone number with country code
- `company_name`: Company name

**Response (201 Created):**
```json
{
  "user": {
    "id": 1,
    "email": "customer1@example.com",
    "username": "customer1",
    "phone": "+919876543210",
    "company_name": "ABC Corporation"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Postman Instructions:**
1. Enter email, username, password, phone, and company name
2. Copy the `tokens.access` value to the `access_token` variable
3. Copy the `tokens.refresh` value to the `refresh_token` variable

---

### 2. Login
**Endpoint:** `POST /api/auth/login/`

**Description:** Login with email and password to receive JWT tokens

**Request Body:**
```json
{
  "email": "customer1@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": 1,
    "email": "customer1@example.com",
    "username": "customer1",
    "phone": "+919876543210",
    "company_name": "ABC Corporation"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Postman Instructions:**
1. Use valid email and password
2. Save the returned tokens to Postman variables for subsequent requests

---

### 3. Refresh Token
**Endpoint:** `POST /api/auth/token/refresh/`

**Description:** Get a new access token using a valid refresh token

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Use Case:** Access tokens expire, use refresh token to get a new one without re-logging in

---

### 4. Logout
**Endpoint:** `POST /api/auth/logout/`

**Description:** Logout and blacklist the refresh token

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

**Note:** After logout, the refresh token cannot be used again

---

## Vehicles

All vehicle endpoints require authentication.

### 1. List Vehicles
**Endpoint:** `GET /api/vehicles/`

**Description:** Get a list of all vehicles

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "vehicle_registration_no": "MH12AB1234",
      "vehicle_type": "truck",
      "manufacturer": "Tata",
      "model": "Sumo",
      "year": 2020,
      "color": "white",
      "vin_number": "VIN123456789ABC",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Create Vehicle
**Endpoint:** `POST /api/vehicles/`

**Description:** Create a new vehicle record

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vehicle_registration_no": "MH12AB1234",
  "vehicle_type": "truck",
  "manufacturer": "Tata",
  "model": "Sumo",
  "year": 2020,
  "color": "white",
  "vin_number": "VIN123456789ABC"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "vehicle_registration_no": "MH12AB1234",
  "vehicle_type": "truck",
  "manufacturer": "Tata",
  "model": "Sumo",
  "year": 2020,
  "color": "white",
  "vin_number": "VIN123456789ABC",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. Get Vehicle Details
**Endpoint:** `GET /api/vehicles/{vehicle_registration_no}/`

**Description:** Get details of a specific vehicle by registration number

**Path Parameters:**
- `vehicle_registration_no` (required): Vehicle registration number (e.g., MH12AB1234)

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "vehicle_registration_no": "MH12AB1234",
  "vehicle_type": "truck",
  "manufacturer": "Tata",
  "model": "Sumo",
  "year": 2020,
  "color": "white",
  "vin_number": "VIN123456789ABC",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Vehicle Lookup (Auto-fill Workflow)
**Endpoint:** `GET /api/vehicles/{vehicle_registration_no}/lookup/`

**Description:** Fetch vehicle with associated driver, helper, and documents in one call. This is the auto-fill endpoint used in the gate entry form.

**Path Parameters:**
- `vehicle_registration_no` (required): Vehicle registration number

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "vehicle": {
    "id": 1,
    "vehicle_registration_no": "MH12AB1234",
    "vehicle_type": "truck",
    "manufacturer": "Tata",
    "model": "Sumo",
    "year": 2020,
    "color": "white",
    "vin_number": "VIN123456789ABC"
  },
  "driver": {
    "id": 1,
    "name": "John Doe",
    "phone_no": "+919876543210",
    "type": "Driver",
    "language": "en"
  },
  "helper": {
    "id": 2,
    "name": "Jane Smith",
    "phone_no": "+919876543211",
    "type": "Helper",
    "language": "hi"
  },
  "documents": [
    {
      "id": 1,
      "customer_email": "customer1@example.com",
      "document_type": "purchase_order",
      "original_filename": "PO_12345.pdf",
      "file_size": 1048576,
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Use Case:** When user enters a vehicle registration number, this endpoint auto-fills all related data for the gate entry form

---

### 5. Update Vehicle
**Endpoint:** `PUT /api/vehicles/{vehicle_registration_no}/`

**Description:** Update vehicle details

**Path Parameters:**
- `vehicle_registration_no` (required): Vehicle registration number

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "vehicle_registration_no": "MH12AB1234",
  "vehicle_type": "truck",
  "manufacturer": "Tata",
  "model": "Sumo",
  "year": 2021,
  "color": "blue",
  "vin_number": "VIN123456789ABC"
}
```

**Response (200 OK):** Updated vehicle object

---

### 6. Delete Vehicle
**Endpoint:** `DELETE /api/vehicles/{vehicle_registration_no}/`

**Description:** Delete a vehicle record

**Path Parameters:**
- `vehicle_registration_no` (required): Vehicle registration number

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content):** Empty response on success

---

## Drivers

All driver endpoints require authentication. The "Drivers" section includes both drivers and helpers.

### 1. List Drivers
**Endpoint:** `GET /api/drivers/`

**Description:** Get a list of all drivers and helpers

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "phone_no": "+919876543210",
      "type": "Driver",
      "language": "en",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "phone_no": "+919876543211",
      "type": "Helper",
      "language": "hi",
      "created_at": "2024-01-15T10:35:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

---

### 2. Create Driver
**Endpoint:** `POST /api/drivers/`

**Description:** Create a new driver or helper record

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone_no": "+919876543210",
  "type": "Driver",
  "language": "en"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "John Doe",
  "phone_no": "+919876543210",
  "type": "Driver",
  "language": "en",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Supported Types:** "Driver" or "Helper"

**Supported Languages:** "en", "hi", "mr", etc.

---

### 3. Get Driver Details
**Endpoint:** `GET /api/drivers/{id}/`

**Description:** Get details of a specific driver by ID

**Path Parameters:**
- `id` (required): Driver/Helper ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "name": "John Doe",
  "phone_no": "+919876543210",
  "type": "Driver",
  "language": "en",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 4. Validate or Create Driver
**Endpoint:** `POST /api/drivers/validate-or-create/`

**Description:** Check if a driver/helper exists by phone number. If not, create a new one. This prevents duplicate entries based on phone uniqueness.

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "phone_no": "+919876543211",
  "type": "Helper",
  "language": "hi"
}
```

**Response (200 OK - Existing):**
```json
{
  "driver": {
    "id": 2,
    "name": "Jane Smith",
    "phone_no": "+919876543211",
    "type": "Helper",
    "language": "hi"
  },
  "created": false,
  "message": "Existing driver/helper found"
}
```

**Response (201 Created - New):**
```json
{
  "driver": {
    "id": 3,
    "name": "New Helper",
    "phone_no": "+919876543212",
    "type": "Helper",
    "language": "en"
  },
  "created": true,
  "message": "New driver/helper created"
}
```

**Use Case:** Used during gate entry submission to ensure no duplicate drivers based on phone number

---

### 5. Update Driver
**Endpoint:** `PUT /api/drivers/{id}/`

**Description:** Update driver/helper information

**Path Parameters:**
- `id` (required): Driver/Helper ID

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "phone_no": "+919876543210",
  "type": "Driver",
  "language": "en"
}
```

**Response (200 OK):** Updated driver object

---

### 6. Delete Driver
**Endpoint:** `DELETE /api/drivers/{id}/`

**Description:** Delete a driver/helper record

**Path Parameters:**
- `id` (required): Driver/Helper ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (204 No Content):** Empty response on success

---

## Documents

All document endpoints require authentication. Documents are stored on disk with paths stored in the database.

### 1. List Documents
**Endpoint:** `GET /api/documents/`

**Description:** Get a list of all active documents (paginated)

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer_email": "customer1@example.com",
      "document_type": "purchase_order",
      "original_filename": "PO_12345.pdf",
      "file_size": 1048576,
      "file_extension": ".pdf",
      "uploaded_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. List Customer Documents
**Endpoint:** `GET /api/documents/list/?customer_email=customer1@example.com`

**Description:** Get all active documents for a specific customer

**Query Parameters:**
- `customer_email` (required): Customer email address

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "count": 3,
  "documents": [
    {
      "id": 1,
      "customer_email": "customer1@example.com",
      "document_type": "purchase_order",
      "original_filename": "PO_12345.pdf",
      "file_size": 1048576,
      "file_extension": ".pdf",
      "is_active": true,
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 3. Upload Document
**Endpoint:** `POST /api/documents/upload/`

**Description:** Upload a new document or replace an existing one. If a document with the same customer email and type exists, it will be replaced.

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `customer_email` (required): Customer email
- `document_type` (required): Type of document (see Document Types below)
- `file` (required): File to upload (PDF, JPG, JPEG, PNG - max 5MB)
- `vehicle_id` (optional): Associated vehicle ID
- `driver_id` (optional): Associated driver ID

**Supported Document Types:**
- `purchase_order`
- `vehicle_registration`
- `vehicle_insurance`
- `puc` (Pollution Under Control)
- `driver_license`
- `transportation_approval`
- `payment_approval`
- `vendor_approval`

**Response (201 Created):**
```json
{
  "document": {
    "id": 1,
    "customer_email": "customer1@example.com",
    "document_type": "purchase_order",
    "original_filename": "PO_12345.pdf",
    "file_size": 1048576,
    "file_path": "/var/customer_portal/documents/customer1_po_20240115.pdf",
    "file_extension": ".pdf",
    "is_active": true,
    "uploaded_at": "2024-01-15T10:30:00Z"
  },
  "replaced": false,
  "message": "Document uploaded successfully",
  "storage_path": "/var/customer_portal/documents/customer1_po_20240115.pdf"
}
```

**Postman Instructions:**
1. Set method to POST
2. Select "form-data" as body type
3. Add customer_email, document_type, and file
4. File upload: Click on file field, select file from computer

---

### 4. Get Document Info
**Endpoint:** `GET /api/documents/{id}/info/`

**Description:** Get detailed information about a specific document

**Path Parameters:**
- `id` (required): Document ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customer_email": "customer1@example.com",
  "document_type": "purchase_order",
  "document_type_display": "Purchase Order",
  "file_path": "/var/customer_portal/documents/customer1_po_20240115.pdf",
  "original_filename": "PO_12345.pdf",
  "file_size": 1048576,
  "file_size_readable": "1.00 MB",
  "file_extension": ".pdf",
  "file_exists": true,
  "is_active": true,
  "uploaded_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 5. Download Document
**Endpoint:** `GET /api/documents/{id}/download/`

**Description:** Download document file from storage

**Path Parameters:**
- `id` (required): Document ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response:** File download (with appropriate content type)

**Postman Instructions:**
1. Send the request
2. Click "Send and Download" button
3. Select save location on your computer

---

### 6. Remove Document (Soft Delete)
**Endpoint:** `DELETE /api/documents/{id}/remove/`

**Description:** Mark a document as inactive (soft delete). File remains on storage.

**Path Parameters:**
- `id` (required): Document ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Document removed successfully",
  "hard_deleted": false
}
```

---

### 7. Remove Document (Hard Delete)
**Endpoint:** `DELETE /api/documents/{id}/remove/?hard_delete=true`

**Description:** Permanently delete document and remove file from storage

**Path Parameters:**
- `id` (required): Document ID

**Query Parameters:**
- `hard_delete` (optional): Set to "true" to permanently delete file

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "message": "Document permanently deleted",
  "hard_deleted": true
}
```

---

## Submissions

All submission endpoints require authentication. The submissions represent gate entry requests with QR code generation.

### 1. List Submissions
**Endpoint:** `GET /api/submissions/`

**Description:** Get a list of all gate entry submissions

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "count": 10,
  "next": "http://localhost:8000/api/submissions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "customer_email": "customer1@example.com",
      "customer_phone": "+919876543210",
      "vehicle": {
        "id": 1,
        "vehicle_registration_no": "MH12AB1234"
      },
      "driver": {
        "id": 1,
        "name": "John Doe"
      },
      "helper": {
        "id": 2,
        "name": "Jane Smith"
      },
      "status": "pending",
      "qr_code_image": "http://localhost:8000/media/qr_codes/submission_1.png",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 2. Get Submission Details
**Endpoint:** `GET /api/submissions/{id}/`

**Description:** Get details of a specific submission by ID

**Path Parameters:**
- `id` (required): Submission ID

**Headers Required:**
```
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "customer_email": "customer1@example.com",
  "customer_phone": "+919876543210",
  "vehicle": {
    "id": 1,
    "vehicle_registration_no": "MH12AB1234",
    "vehicle_type": "truck",
    "manufacturer": "Tata",
    "model": "Sumo"
  },
  "driver": {
    "id": 1,
    "name": "John Doe",
    "phone_no": "+919876543210",
    "type": "Driver",
    "language": "en"
  },
  "helper": {
    "id": 2,
    "name": "Jane Smith",
    "phone_no": "+919876543211",
    "type": "Helper",
    "language": "hi"
  },
  "status": "pending",
  "qr_code_image": "http://localhost:8000/media/qr_codes/submission_1.png",
  "qr_payload_hash": "abc123def456...",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

---

### 3. Create Gate Entry Submission
**Endpoint:** `POST /api/submissions/create/`

**Description:** Create a new gate entry submission with QR code generation. This is the main workflow endpoint that:
1. Gets or creates vehicle
2. Validates or creates driver
3. Validates or creates helper (optional)
4. Creates submission record
5. Generates QR code
6. Handles document uploads
7. Creates audit log
8. Sends email and SMS notifications

**Headers Required:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data (Required):**
- `customer_email` (required): Customer email
- `customer_phone` (required): Customer phone number
- `vehicle_number` (required): Vehicle registration number
- `driver_name` (required): Driver name
- `driver_phone` (required): Driver phone number
- `driver_language` (optional, default: "en"): Driver's language preference

**Form Data (Optional):**
- `helper_name` (optional): Helper name (if applicable)
- `helper_phone` (optional): Helper phone number
- `helper_language` (optional): Helper's language preference
- `purchase_order` (optional): File
- `vehicle_registration` (optional): File
- `vehicle_insurance` (optional): File
- `puc` (optional): File
- `driver_license` (optional): File
- `transportation_approval` (optional): File
- `payment_approval` (optional): File
- `vendor_approval` (optional): File

**Response (201 Created):**
```json
{
  "submission": {
    "id": 1,
    "qrCodeImage": "http://localhost:8000/media/qr_codes/submission_1.png",
    "vehicleNumber": "MH12AB1234",
    "driverPhone": "+919876543210",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Postman Instructions:**
1. Set method to POST
2. Select "form-data" as body type
3. Add all required fields (customer_email, customer_phone, vehicle_number, driver_name, driver_phone)
4. Optionally add helper details and document files
5. Send the request
6. Response will include QR code image URL

**Example Workflow:**
```
1. Customer fills gate entry form
2. Enters vehicle registration number (e.g., MH12AB1234)
3. Enters driver details
4. Optionally adds helper details
5. Optionally uploads documents
6. Submission endpoint creates everything and generates QR code
7. QR code is sent to customer email and SMS
8. Customer presents QR code at gate
```

---

## Environment Variables

Store these in Postman for easy access across requests:

| Variable Name | Description | Example |
|---|---|---|
| `access_token` | JWT access token (set after login) | `eyJ0eXAiOiJKV1QiLCJhbGc...` |
| `refresh_token` | JWT refresh token (set after login) | `eyJ0eXAiOiJKV1QiLCJhbGc...` |
| `base_url` | API base URL | `http://localhost:8000` |
| `customer_email` | Test customer email | `customer1@example.com` |
| `vehicle_reg` | Test vehicle registration | `MH12AB1234` |

**How to set variables in Postman:**
1. Click "Variables" tab in collection
2. Enter variable name and initial value
3. Use in requests: `{{variable_name}}`

---

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "Invalid input data",
  "detail": "Field 'email' is required"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action"
}
```

**404 Not Found:**
```json
{
  "detail": "Vehicle not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error occurred",
  "detail": "Please contact support"
}
```

### Token Expiration

If you receive a 401 error:
1. Check if access token is expired
2. Call **Refresh Token** endpoint with your refresh token
3. Update the `access_token` variable with the new token
4. Retry the request

---

## Quick Testing Checklist

- [ ] **Register** a new customer account
- [ ] **Login** with the registered credentials
- [ ] **Save tokens** to Postman variables
- [ ] **Create a vehicle** with registration number
- [ ] **List vehicles** to verify creation
- [ ] **Get vehicle details** by registration number
- [ ] **Create a driver**
- [ ] **Validate or create a driver** with the same phone number (should return existing)
- [ ] **Upload a document** for the customer
- [ ] **Download the document** to verify
- [ ] **Create a gate entry submission** with all details
- [ ] **List submissions** to see the created submission
- [ ] **Get submission details** to verify QR code was generated
- [ ] **Logout** to test token blacklisting

---

## Troubleshooting

### Issue: 401 Unauthorized on all requests

**Solution:** 
1. Ensure you're using the latest access token
2. Login again and update the `access_token` variable
3. Check that Bearer token is properly formatted: `Bearer <token>`

### Issue: File upload fails

**Solution:**
1. Ensure file size is under 5MB
2. File format must be PDF, JPG, JPEG, or PNG
3. Use "form-data" body type in Postman
4. Check that `customer_email` and `document_type` fields are provided

### Issue: Vehicle lookup returns null driver/helper

**Solution:**
1. Ensure there's a recent submission for that vehicle
2. The lookup returns data from the latest submission
3. Create a submission first, then try vehicle lookup

### Issue: Submission creation fails

**Solution:**
1. Check all required fields are provided
2. Use a valid vehicle registration number format
3. Driver phone number must be unique or match existing driver
4. Ensure at least one document file is valid (if provided)

---

## API Rate Limits

Currently, there are no rate limits configured. Production deployments should implement:
- IP-based rate limiting
- Per-user rate limiting
- Throttling for endpoints

---

## Security Notes

1. **Never commit tokens** to version control
2. **Use HTTPS in production** (not HTTP)
3. **Refresh tokens regularly** - access tokens expire
4. **Secure token storage** - don't store in browser localStorage
5. **CORS settings** - configure in production
6. **API keys** - implement if exposing to public

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `python manage.py runserver`
3. Check Postman console for request/response details
4. Verify all required fields are provided in requests

---

**Version:** 1.0  
**Last Updated:** December 1, 2025  
**Backend:** Django + Django REST Framework  
**Authentication:** JWT (SimpleJWT)
