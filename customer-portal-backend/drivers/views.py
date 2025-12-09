# customer-portal-backend/drivers/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .models import DriverHelper
from .serializers import DriverHelperSerializer, DriverHelperValidateSerializer


class DriverHelperViewSet(viewsets.ModelViewSet):
    queryset = DriverHelper.objects.all()
    serializer_class = DriverHelperSerializer

    def destroy(self, request, *args, **kwargs):
        """
        Override delete to return custom success message based on type

        DELETE /api/drivers/{id}/
        """
        driver = self.get_object()
        driver_name = driver.name
        driver_type = driver.type
        driver.delete()

        return Response(
            {"message": f"{driver_type} {driver_name} deleted successfully"},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], url_path='validate-or-create')
    def validate_or_create(self, request):
        """
        Validate phone uniqueness and create if needed
        
        POST /api/drivers/validate-or-create/
        
        Request:
        {
            "name": "John Doe",
            "phoneNo": "+919876543210",
            "type": "Driver",
            "language": "en",
            "uid": "123456789012"
        }
        
        Response:
        {
            "driver": {...},
            "created": true/false,
            "message": "..."
        }
        """
        serializer = DriverHelperValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data['name']
        phone_no = serializer.validated_data['phoneNo']
        driver_type = serializer.validated_data['type']
        language = serializer.validated_data.get('language', 'en')
        uid = serializer.validated_data.get('uid')

        try:
            # First check if uid already exists
            if uid:
                existing_by_uid = DriverHelper.objects.filter(uid=uid).first()
                if existing_by_uid:
                    # UID exists - check if it matches the phone and name
                    if existing_by_uid.phoneNo == phone_no:
                        # Same phone, check name
                        if existing_by_uid.name.lower() == name.lower():
                            # Exact match - return existing
                            return Response({
                                "driver": DriverHelperSerializer(existing_by_uid).data,
                                "created": False,
                                "message": "Existing driver/helper found with matching details"
                            }, status=status.HTTP_200_OK)
                        else:
                            # Same UID and phone but different name
                            return Response({
                                "error": f"Aadhar number is already registered with name '{existing_by_uid.name}'. Please verify the details."
                            }, status=status.HTTP_400_BAD_REQUEST)
                    else:
                        # Same UID but different phone
                        return Response({
                            "error": f"Aadhar number is already registered with a different phone number. Please verify the Aadhar number."
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check by phone number
            existing_by_phone = DriverHelper.objects.filter(phoneNo=phone_no).first()
            if existing_by_phone:
                # Phone exists - check name match
                if existing_by_phone.name.lower() == name.lower():
                    # Update language if changed
                    if existing_by_phone.language != language:
                        existing_by_phone.language = language
                        existing_by_phone.save()
                    
                    return Response({
                        "driver": DriverHelperSerializer(existing_by_phone).data,
                        "created": False,
                        "message": "Existing driver/helper found"
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "error": f"Phone number is already registered with a different person ('{existing_by_phone.name}'). Please enter a different phone number."
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # No conflicts - create new
            if not uid:
                return Response({
                    "error": "Aadhar number (uid) is required to create a new driver/helper"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            instance = DriverHelper.objects.create(
                uid=uid,
                name=name,
                phoneNo=phone_no,
                type=driver_type,
                language=language,
                isBlacklisted=False,
                rating=None
            )
            
            return Response({
                "driver": DriverHelperSerializer(instance).data,
                "created": True,
                "message": "New driver/helper created successfully"
            }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            return Response({
                "error": str(e.message) if hasattr(e, 'message') else str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], url_path="by-vehicle")
    def get_by_vehicle(self, request):
        """
        Get ALL drivers and helpers for a vehicle (not just most recent)

        GET /api/drivers/by-vehicle/?vehicle_id={vehicle_id}
        """
        vehicle_id = request.query_params.get("vehicle_id")

        if not vehicle_id:
            return Response(
                {"error": "vehicle_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from podrivervehicletagging.models import DriverVehicleTagging

            # Get ALL unique drivers and helpers for this vehicle
            taggings = (
                DriverVehicleTagging.objects.filter(vehicleId_id=vehicle_id)
                .select_related("driverId", "helperId")
                .order_by("-created")
            )

            # Extract unique drivers and helpers
            drivers_dict = {}
            helpers_dict = {}

            for tagging in taggings:
                if tagging.driverId and tagging.driverId.id not in drivers_dict:
                    drivers_dict[tagging.driverId.id] = tagging.driverId
                
                if tagging.helperId and tagging.helperId.id not in helpers_dict:
                    helpers_dict[tagging.helperId.id] = tagging.helperId

            # Convert to lists and serialize
            drivers_data = [
                DriverHelperSerializer(driver).data 
                for driver in drivers_dict.values()
            ]
            helpers_data = [
                DriverHelperSerializer(helper).data 
                for helper in helpers_dict.values()
            ]

            return Response({
                "drivers": drivers_data,
                "helpers": helpers_data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)