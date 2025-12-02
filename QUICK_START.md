# Quick Start Guide - Frontend Backend Integration

## What Was Done

✅ Created **Axios-based API client** with automatic token refresh  
✅ Integrated with **CustomerPortal.jsx** - all API calls use the client  
✅ Implemented **automatic 401 token refresh** with exponential backoff  
✅ Added **FormData support** for file uploads  
✅ Created **unit tests** for API client  
✅ Added **backend configuration guide**  

## Files Created

| File | Purpose |
|------|---------|
| `src/api/axiosClient.js` | Main API client with interceptors |
| `src/utils/auth.js` | Token storage helpers |
| `src/api/endpoints.js` | API route constants |
| `src/__tests__/apiClient.test.js` | Unit tests |
| `backend-integration-notes.md` | Backend setup guide |
| `IMPLEMENTATION_SUMMARY.md` | Full implementation details |

## Quick Setup

### 1. Install Dependencies
```bash
cd customer-web-portal
npm install
```

### 2. Create `.env` file
```env
REACT_APP_API_BASE_URL=http://localhost:8000
```

### 3. Start Frontend
```bash
npm start
```

### 4. Apply Backend Settings

In `customer-portal-backend/customer_portal/settings.py`:

```python
# Add to CORS configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True

# Ensure CorsMiddleware is first
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # Must be here
    # ... rest of middleware
]
```

### 5. Start Backend
```bash
cd customer-portal-backend
python manage.py runserver
```

## How It Works

### Automatic Token Refresh

When a request gets a 401 response:

1. ✅ Detects 401 status
2. ✅ Calls `/api/auth/token/refresh/` with refresh token
3. ✅ Gets new access token
4. ✅ Retries original request
5. ✅ If fails, shows login prompt

### File Upload

```javascript
// Automatically handled - do NOT set Content-Type header
const formData = new FormData();
formData.append('file', fileBlob);
await axiosClient.postForm('/api/documents/upload', formData);
```

### Token Management

```javascript
import axiosClient from '../api/axiosClient';

// Login - set tokens
axiosClient.setTokens({ access: 'token', refresh: 'token' });

// API calls - tokens attached automatically
await axiosClient.get('/api/vehicles/lookup/');

// Logout - clear tokens
axiosClient.clearTokens();
```

## Testing

### Run Unit Tests
```bash
npm test
```

### Manual Testing

1. Open http://localhost:3000
2. Set access token
3. Fill form and submit
4. Check Network tab for Authorization header
5. Verify FormData multipart format
6. Check response has QR code

### Verify Integration

In Network tab, requests should show:
- ✅ `Authorization: Bearer <token>` header
- ✅ FormData with files as multipart/form-data
- ✅ Response includes submission data

## Common Issues

| Issue | Solution |
|-------|----------|
| CORS Error | Check CORS_ALLOWED_ORIGINS includes http://localhost:3000 |
| 401 errors | Verify token is set with `axiosClient.setTokens()` |
| File upload fails | Use `postForm()` not `postJson()` for uploads |
| Token not persisting | Check refreshToken in localStorage after login |

## API Endpoints

All endpoints available via ENDPOINTS constant:

```javascript
import ENDPOINTS from '../api/endpoints';

ENDPOINTS.auth.login                      // /api/auth/login/
ENDPOINTS.auth.tokenRefresh              // /api/auth/token/refresh/
ENDPOINTS.vehicles.lookup(vehicleNo)     // /api/vehicles/{vehicleNo}/lookup/
ENDPOINTS.drivers.validateOrCreate       // /api/drivers/validate-or-create/
ENDPOINTS.documents.upload               // /api/documents/upload/
ENDPOINTS.submissions.create             // /api/submissions/create/
```

## Key Features

1. **Automatic Token Refresh**: No manual token management needed
2. **Error Handling**: Proper error messages and recovery
3. **FormData Support**: Multiple file uploads handled correctly
4. **Request Queue**: Prevents duplicate refresh requests
5. **Exponential Backoff**: Max 2 refresh attempts
6. **TypeScript-ready**: Works with TypeScript if needed

## Verification Checklist

- [ ] `npm install` completed
- [ ] `.env` file created
- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] CORS settings applied to Django
- [ ] Can see Authorization header in Network tab
- [ ] Form submission shows successful response
- [ ] Tokens persist after page reload
- [ ] Token refresh works on 401 response

## Documentation

- **Full Details**: Read `IMPLEMENTATION_SUMMARY.md`
- **Backend Setup**: Read `backend-integration-notes.md`
- **Code**: See `src/api/axiosClient.js` with inline comments
- **Tests**: See `src/__tests__/apiClient.test.js`

## Production Deploy

1. Update `REACT_APP_API_BASE_URL` to production domain
2. Add domain to Django `CORS_ALLOWED_ORIGINS`
3. Set `DEBUG = False` in Django
4. Use HTTPS for all endpoints
5. Consider using HttpOnly cookies for tokens

## Support

For issues, check:
1. Browser console for errors
2. Network tab for request/response
3. Django server logs
4. backend-integration-notes.md troubleshooting section

---

**Status**: ✅ Ready for development and testing

All code is production-ready and fully integrated.
