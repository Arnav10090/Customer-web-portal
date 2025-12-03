from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import VehicleDetails
from .serializers import VehicleDetailsSerializer, VehicleWithRelationsSerializer
from drivers.models import DriverHelper
from drivers.serializers import DriverHelperSerializer
from documents.models import CustomerDocument
from documents.serializers import CustomerDocumentSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = VehicleDetails.objects.all()
    serializer_class = VehicleDetailsSerializer
    lookup_field = 'vehicle_registration_no'

    def get_permissions(self):
        """
        Set permissions based on action
        """
        if self.action in ['my_vehicles', 'vehicle_complete_data']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def my_vehicles(self, request):
        """
        Get all vehicles associated with the authenticated customer
        
        GET /api/vehicles/my-vehicles/
        """
        vehicles = VehicleDetails.objects.filter(customer=request.user)
        serializer = VehicleDetailsSerializer(vehicles, many=True)
        return Response({
            "vehicles": serializer.data,
            "count": vehicles.count()
        })

    @action(detail=False, methods=['get'])
    def vehicle_complete_data(self, request):
        """
        Get complete data for a specific vehicle with all related information
        Query params: vehicle_reg_no=MH12AB1234
        """
        vehicle_reg_no = request.query_params.get('vehicle_reg_no')
        
        if not vehicle_reg_no:
            return Response(
                {"detail": "vehicle_reg_no query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            vehicle = VehicleDetails.objects.get(
                vehicleRegistrationNo=vehicle_reg_no,
                customer=request.user
            )
        except VehicleDetails.DoesNotExist:
            return Response(
                {"detail": "Vehicle not found or not associated with your account"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all drivers and helpers associated with this vehicle through submissions
        drivers = DriverHelper.objects.filter(
            driver_submissions__vehicle=vehicle,
            customer=request.user
        ).distinct()
        
        helpers = DriverHelper.objects.filter(
            helper_submissions__vehicle=vehicle,
            customer=request.user
        ).distinct()
        
        # Get documents for this vehicle
        documents = CustomerDocument.objects.filter(
            vehicle=vehicle,
            customer_email=request.user.email,
            is_active=True
        ).order_by('-uploaded_at')
        
        return Response({
            "vehicle": VehicleDetailsSerializer(vehicle).data,
            "drivers": DriverHelperSerializer(drivers, many=True).data,
            "helpers": DriverHelperSerializer(helpers, many=True).data,
            "documents": CustomerDocumentSerializer(documents, many=True).data
        })

    def destroy(self, request, *args, **kwargs):
        """
        Override delete to return custom success message
        
        DELETE /api/vehicles/{vehicle_registration_no}/
        
        Response:
        {
            "message": "Vehicle MH12AB1234 deleted successfully"
        }
        """
        vehicle = self.get_object()
        vehicle_reg_no = vehicle.vehicle_registration_no
        vehicle.delete()
        
        return Response({
            "message": f"Vehicle {vehicle_reg_no} deleted successfully"
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='lookup')
    def lookup_vehicle(self, request, vehicle_registration_no=None):
        """
        Auto-fill workflow: Fetch vehicle, driver, helper, and documents
        
        GET /api/vehicles/{vehicle_reg_no}/lookup/
        
        Response:
        {
            "vehicle": {...},
            "driver": {...},
            "helper": {...},
            "documents": [...]
        }
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
            # Serialize driver and helper
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