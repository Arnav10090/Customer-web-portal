# Backend Integration Notes

This document provides configuration recommendations for integrating the React frontend with the Django backend for the Customer Gate Entry Portal.

## Frontend Setup

The frontend is now configured to use Axios with automatic token refresh. The following environment variables can be set:

### Environment Variables

Create a `.env` file in the `customer-web-portal/` root directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000

# Optional: Enable/disable test modes
REACT_APP_ENABLE_MOCK_MODE=false
```

For production, create `.env.production`:

```env
REACT_APP_API_BASE_URL=https://your-production-domain.com
```

### Proxy Configuration

The `package.json` includes a proxy setting for development:

```json
"proxy": "http://localhost:8000"
```

This allows the frontend to proxy API requests to the backend during development. If using environment variables, this can be removed.

## Backend Configuration

### 1. CORS Configuration (Django Settings)

Ensure `customer-portal-backend/customer_portal/settings.py` includes the following CORS configuration:

```python
# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",  # For testing on custom hosts
]

CORS_ALLOW_CREDENTIALS = True
```

For production, add your frontend domain:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Keep for development
    "http://127.0.0.1:3000",
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 2. Middleware Configuration

Ensure `corsheaders.middleware.CorsMiddleware` is placed **before** other middleware in Django settings:

```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be here, early in the list
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### 3. JWT Configuration

Ensure JWT tokens are properly configured in Django settings:

```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Short-lived access tokens
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Longer-lived refresh tokens
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
```

### 4. API Endpoints

Ensure the following endpoints are implemented and match the frontend's expectations:

#### Authentication Endpoints

- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh access token

#### Vehicle Endpoints

- `GET /api/vehicles/{vehicle_registration_no}/lookup/` - Get vehicle details and related data

#### Driver Endpoints

- `POST /api/drivers/validate-or-create/` - Validate or create driver/helper

#### Document Endpoints

- `POST /api/documents/upload/` - Upload document files

#### Submission Endpoints

- `POST /api/submissions/create/` - Create gate entry submission

## Token Management

### Frontend Token Strategy

The frontend implements the following token management strategy:

1. **Access Token**: Stored in memory. Automatically attached to all API requests.
2. **Refresh Token**: Stored in localStorage for persistence across browser sessions.

### Token Refresh Flow

When a request returns a 401 (Unauthorized) response:

1. The response interceptor detects the 401 status
2. Automatically calls the `/api/auth/token/refresh/` endpoint
3. Exchanges the refresh token for a new access token
4. Retries the original request with the new access token
5. If refresh fails, clears tokens and prompts user to log in again

### Request Format for Token Refresh

```
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "<refresh_token>"
}
```

**Expected Response:**

```json
{
  "access": "<new_access_token>",
  "refresh": "<new_or_same_refresh_token>"  // Optional, can return rotated refresh token
}
```

## API Integration Points

### 1. Token Initialization

When the frontend loads, it checks for an existing refresh token in localStorage. If found, it initializes the API client with that token.

### 2. Form Submission

The submission endpoint expects FormData with the following fields:

```
POST /api/submissions/create/

FormData:
- customerEmail: string
- customerPhone: string
- vehicleNumber: string
- driverName: string
- driverPhone: string
- driverLanguage: string
- helperName: string (optional)
- helperPhone: string (optional)
- helperLanguage: string (optional)
- purchase_order: File (optional)
- vehicle_registration: File (optional)
- vehicle_insurance: File (optional)
- puc: File (optional)
- driver_license: File (optional)
- transportation_approval: File (optional)
- payment_approval: File (optional)
- vendor_approval: File (optional)
```

### 3. Automatic Token Injection

All API requests automatically include the Authorization header:

```
Authorization: Bearer <access_token>
```

No manual token injection is needed in the frontend code.

## Error Handling

The frontend implements comprehensive error handling:

- **401 (Unauthorized)**: Token refresh attempted; user prompted to login if refresh fails
- **404 (Not Found)**: Fallback demo QR code generated for testing
- **Other errors**: User-friendly error messages displayed

## Development Testing

### Local Development Setup

1. **Start Django Backend:**
   ```bash
   cd customer-portal-backend
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Start React Frontend:**
   ```bash
   cd customer-web-portal
   npm install
   npm start
   ```

3. **Test API Calls:**
   - Open browser DevTools → Network tab
   - Monitor requests to verify Authorization header is sent
   - Check for proper CORS headers in responses

### Manual Verification Checklist

- [ ] Token is stored in localStorage after login
- [ ] Authorization header includes Bearer token in all requests
- [ ] CORS headers are present in responses
- [ ] 401 errors trigger automatic token refresh
- [ ] File uploads use multipart/form-data
- [ ] Form submission returns 201 status with QR code data
- [ ] Form reset clears all fields and files after success
- [ ] Session expiry shows login prompt
- [ ] Backend logs show authentication attempts

## Security Considerations

1. **HTTPS Only (Production)**: Ensure all API calls use HTTPS in production
2. **Token Expiry**: Keep access token lifetime short (15-30 minutes recommended)
3. **Refresh Token Security**: Refresh tokens should have strict expiry (7-30 days)
4. **CORS Allowlist**: Only allow trusted origins in CORS_ALLOWED_ORIGINS
5. **CSRF Protection**: Keep CSRF middleware enabled for session-based endpoints
6. **HttpOnly Cookies (Alternative)**: Consider using HttpOnly cookies for refresh tokens instead of localStorage for enhanced security

## Troubleshooting

### CORS Errors

**Error:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solution:**
1. Verify `corsheaders` package is installed: `pip install django-cors-headers`
2. Check CORS_ALLOWED_ORIGINS includes frontend URL
3. Verify CorsMiddleware is first in MIDDLEWARE list
4. Restart Django server after settings changes

### 401 Errors

**Error:** "Unauthorized" responses for all requests

**Solution:**
1. Verify access token is being sent: Check DevTools Network tab Authorization header
2. Check token expiry: Tokens may be expired
3. Verify JWT secret key: Must match between frontend and backend
4. Ensure refresh token endpoint is working

### File Upload Issues

**Error:** "multipart/form-data" content-type errors

**Solution:**
1. Frontend automatically handles Content-Type header
2. Do not manually set Content-Type in request headers
3. Use `axiosClient.postForm()` for file uploads (not `postJson`)
4. Ensure backend accepts MultiPartParser

## Production Deployment

For production deployment:

1. Update `REACT_APP_API_BASE_URL` to production API domain
2. Update `CORS_ALLOWED_ORIGINS` to include production frontend domain
3. Set `DEBUG = False` in Django settings
4. Use environment variables for sensitive data (secrets, API keys)
5. Enable HTTPS for all API endpoints
6. Consider using a CDN for static assets
7. Implement rate limiting on API endpoints
8. Add request/response logging for debugging

## Additional Resources

- Axios Documentation: https://axios-http.com/
- Django REST Framework: https://www.django-rest-framework.org/
- Simple JWT: https://github.com/jpadilla/django-rest-framework-simplejwt
- CORS Documentation: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing
