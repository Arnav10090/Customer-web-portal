# Frontend-Backend Integration Setup Complete

## Changes Made

### 1. **API Service Module** (`src/services/api.js`)
   - Created axios instance with base URL pointing to `http://localhost:8000/api`
   - Implemented request interceptor to automatically add JWT tokens to requests
   - Implemented response interceptor to handle token refresh on 401 errors
   - Created API modules for:
     - `authAPI`: login, register endpoints
     - `documentsAPI`: document management endpoints
     - `submissionsAPI`: submission and QR code generation endpoints
     - `vehiclesAPI`: vehicle management endpoints
     - `driversAPI`: driver management endpoints

### 2. **AuthContext Updates** (`src/context/AuthContext.jsx`)
   - Removed localStorage-based authentication
   - Integrated with backend API using `authAPI` service
   - Login now makes actual API call to `/api/auth/login/`
   - Register now makes actual API call to `/api/auth/register/`
   - Stores JWT tokens (`accessToken`, `refreshToken`) in localStorage
   - Stores user data with ID from backend
   - Added error state for better error handling
   - Logout clears tokens and user data

### 3. **Login Component Updates** (`src/components/Login.jsx`)
   - Updated `handleSubmit` to use async/await with the new API-based login
   - Removed unnecessary artificial delay

### 4. **Register Component Updates** (`src/components/Register.jsx`)
   - Updated `handleSubmit` to use async/await with the new API-based register
   - Removed unnecessary artificial delay

### 5. **CustomerPortal Component Updates** (`src/components/CustomerPortal.jsx`)
   - Added imports for `submissionsAPI` and `documentsAPI`
   - Ready for integration of submission and document management API calls

## How It Works

### Authentication Flow
1. User enters email/password on Login page
2. Login component calls `useAuth().login()` with credentials
3. AuthContext makes POST request to `/api/auth/login/`
4. Backend validates credentials and returns user data + JWT tokens
5. Tokens stored in localStorage automatically
6. Request interceptor adds token to all future API requests

### Automatic Token Refresh
- If any API request returns 401 (Unauthorized)
- Response interceptor automatically refreshes token using refresh token
- Retries the original request with new token
- If refresh fails, clears all auth data and redirects to login

## Next Steps for Testing

### Start the Backend
```bash
cd customer-portal-backend
# Activate virtual environment (if not already)
venv\Scripts\activate

# Run migrations (if needed)
python manage.py migrate

# Start server
python manage.py runserver 0.0.0.0:8000
```

### Start the Frontend
```bash
# In a new terminal, from project root
npm start
# or
node start-server.js
```

### Test the Integration
1. Navigate to `http://localhost:3000`
2. Try registering a new account
3. Register should create user in backend database
4. You should be logged in automatically after registration
5. Login with those credentials should work
6. Try submitting a form with documents

## Environment Variables

**Frontend** (`.env`):
```
REACT_APP_API_BASE_URL=http://localhost:8000
```

**Backend** (`.env`):
```
DB_NAME=customer_portal_db
DB_USER=postgres
DB_PASSWORD=19207197
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

## CORS Configuration
The backend CORS settings in `customer_portal/settings.py` allow:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Make sure frontend runs on these addresses.

## API Endpoints Available

- **Auth**: `/api/auth/login/`, `/api/auth/register/`, `/api/auth/token/refresh/`
- **Submissions**: `/api/submissions/` - CRUD operations
- **Documents**: `/api/documents/` - Document uploads
- **Vehicles**: `/api/vehicles/` - Vehicle management
- **Drivers**: `/api/drivers/` - Driver management

## What Still Needs to Be Done

1. **Update CustomerPortal.jsx `handleSubmit`** to use `submissionsAPI.createSubmission()` instead of fetch
2. **Map FormData field names** to match backend expectations
3. **Test file uploads** for documents
4. **Test QR code generation** in backend
5. **Add error handling UI** for specific API errors
