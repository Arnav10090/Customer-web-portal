from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VehicleDetails
from .serializers import VehicleDetailsSerializer
from drivers.models import DriverHelper
from drivers.serializers import DriverHelperSerializer
from documents.models import CustomerDocument
from documents.serializers import CustomerDocumentSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = VehicleDetails.objects.all()
    serializer_class = VehicleDetailsSerializer
    lookup_field = 'vehicle_registration_no'

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