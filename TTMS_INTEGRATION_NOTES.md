# TTMS Django Integration Summary

## Database Schema Changes Completed ✓

### 1. Tables Created in TTMS Database (13 tables)
- ✓ Users
- ✓ ZoneType  
- ✓ Zone
- ✓ VehicleDetails
- ✓ DriverHelper
- ✓ DocumentControl
- ✓ PODetails
- ✓ ParkingSpot
- ✓ RFTags
- ✓ DriverVehicleTagging
- ✓ PODriverVehicleTagging
- ✓ VehicleTracking
- ✓ Alarms

### 2. Django Models Updated

#### authentication/models.py
- ✓ Added ZoneType model
- ✓ Added Zone model  
- ✓ Updated CustomerUser model to map to Users table
  - Uses TTMS field names: empId, firstName, lastName, telephone, userType, zoneTypeName
  - Kept email as unique USERNAME_FIELD

#### vehicles/models.py
- ✓ Updated VehicleDetails model to use TTMS field names
  - Changed: vehicle_registration_no → vehicleRegistrationNo
  - Changed: remark from TextField to CharField
  - Removed: updated field

#### drivers/models.py
- ✓ Updated DriverHelper model to use TTMS field names
  - Changed: phone_no → phoneNo
  - Changed: is_blacklisted → isBlacklisted
  - Removed: updated field

#### documents/models.py
- ✓ Added DocumentControl model for TTMS table
- ✓ Kept CustomerDocument for backward API compatibility

### 3. Frontend API Integration Required

The frontend `api.js` service needs to be updated to map old field names to new ones:

**Changes needed:**
1. `firstname` / `lastname` → already mapped to `first_name` / `last_name` in backend
2. Update user data field mappings when receiving from backend:
   - `first_name` → `firstName`
   - `last_name` → `lastName`
   - Add `telephone` (was `phone`)

### 4. Manual Steps Required

Since TTMS tables already exist without migrations:

1. Use `python manage.py migrate --fake-initial` to mark migrations as applied
2. OR manually manage the legacy CustomerUser table alongside new Users table
3. Update AuthContext.jsx to use new field names from backend

### 5. Backward Compatibility

- CustomerDocument table kept for existing document API
- Both tables can coexist until full migration complete
- All endpoints should map between old and new field names

## Next Steps

1. **Option A:** Use `--fake-initial` to treat existing TTMS tables as migrated
   ```
   python manage.py migrate --fake-initial
   ```

2. **Option B:** Create custom migrations that don't touch the existing TTMS tables
   
3. **Option C:** Update serializers to map field names automatically

Recommended: Use **Option A** + update serializers for field mapping.
