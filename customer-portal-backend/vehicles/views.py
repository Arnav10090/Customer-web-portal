from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Prefetch
from .models import VehicleDetails
from .serializers import VehicleDetailsSerializer
from drivers.models import DriverHelper
from drivers.serializers import DriverHelperSerializer
from documents.models import DocumentControl
from documents.serializers import DocumentControlSerializer

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = VehicleDetails.objects.all()
    serializer_class = VehicleDetailsSerializer
    lookup_field = 'vehicleRegistrationNo'

    def get_permissions(self):
        """Set permissions based on action"""
        if self.action in ['my_vehicles', 'vehicle_complete_data', 'create_or_get_vehicle']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], url_path='my-vehicles')
    def my_vehicles(self, request):
        """Get all vehicles associated with the authenticated customer"""
        vehicles = VehicleDetails.objects.filter(
            customer=request.user
        ).distinct().order_by('-created')
        
        serializer = VehicleDetailsSerializer(vehicles, many=True)
        return Response({
            "vehicles": serializer.data,
            "count": vehicles.count()
        })

    @action(detail=False, methods=['post'], url_path='create-or-get')
    def create_or_get_vehicle(self, request):
        """
        Create vehicle if doesn't exist, or get existing vehicle with complete data
        Returns driver, helper, PO number, and document information for auto-fill
        """
        vehicle_number = request.data.get('vehicle_number', '').strip().upper()
        
        if not vehicle_number:
            return Response(
                {"error": "Vehicle number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create vehicle
        vehicle, created = VehicleDetails.objects.get_or_create(
            vehicleRegistrationNo=vehicle_number,
            defaults={'customer': request.user}
        )
        
        # If vehicle exists but has no customer, assign current user
        if not created and not vehicle.customer:
            vehicle.customer = request.user
            vehicle.save()
        
        # Get the most recent submission for this vehicle to auto-fill
        from submissions.models import GateEntrySubmission
        from podrivervehicletagging.models import PODriverVehicleTagging
        
        latest_submission = GateEntrySubmission.objects.filter(
            vehicle=vehicle
        ).select_related('driver', 'helper').order_by('-created_at').first()
        
        driver_data = None
        helper_data = None
        po_number = None
        documents_data = []
        
        if latest_submission:
            # Get driver info
            if latest_submission.driver:
                driver_data = {
                    "id": latest_submission.driver.id,
                    "name": latest_submission.driver.name,
                    "phoneNo": latest_submission.driver.phoneNo,
                    "language": latest_submission.driver.language,
                    "type": latest_submission.driver.type
                }
            
            # Get helper info
            if latest_submission.helper:
                helper_data = {
                    "id": latest_submission.helper.id,
                    "name": latest_submission.helper.name,
                    "phoneNo": latest_submission.helper.phoneNo,
                    "language": latest_submission.helper.language,
                    "type": latest_submission.helper.type
                }
            
            # Get PO number from the latest submission
            # Find the PODriverVehicleTagging that links to this submission's driver-vehicle combo
            try:
                po_tagging = PODriverVehicleTagging.objects.filter(
                    driverVehicleTaggingId__vehicleId=vehicle,
                    driverVehicleTaggingId__driverId=latest_submission.driver
                ).select_related('poId').order_by('-created').first()
                
                if po_tagging and po_tagging.poId:
                    po_number = po_tagging.poId.id  # PO number is the ID field
            except Exception as e:
                print(f"Could not fetch PO number: {e}")
        
        # Get all documents for this vehicle from DocumentControl
        documents = DocumentControl.objects.filter(
            referenceId=vehicle.id,
            type__in=['vehicle_registration', 'vehicle_insurance', 'vehicle_puc']
        ).order_by('-created')
        
        documents_data = DocumentControlSerializer(documents, many=True).data
        
        return Response({
            "vehicle": VehicleDetailsSerializer(vehicle).data,
            "driver": driver_data,
            "helper": helper_data,
            "po_number": po_number,  # Added PO number to response
            "documents": documents_data,
            "created": created,
            "message": "New vehicle created" if created else "Existing vehicle found"
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='vehicle-complete-data')
    def vehicle_complete_data(self, request):
        """
        Get complete data for a specific vehicle with all related information
        Query params: vehicle_reg_no=MH14X5456
        """
        vehicle_reg_no = request.query_params.get('vehicle_reg_no')
        
        if not vehicle_reg_no:
            return Response(
                {"detail": "vehicle_reg_no query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            vehicle = VehicleDetails.objects.get(
                vehicleRegistrationNo=vehicle_reg_no
            )
        except VehicleDetails.DoesNotExist:
            return Response(
                {"detail": "Vehicle not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get the most recent submission for auto-fill
        from submissions.models import GateEntrySubmission
        latest_submission = GateEntrySubmission.objects.filter(
            vehicle=vehicle
        ).select_related('driver', 'helper').order_by('-created_at').first()
        
        driver_data = None
        helper_data = None
        
        if latest_submission:
            if latest_submission.driver:
                driver_data = {
                    "id": latest_submission.driver.id,
                    "name": latest_submission.driver.name,
                    "phoneNo": latest_submission.driver.phoneNo,
                    "language": latest_submission.driver.language,
                    "type": latest_submission.driver.type
                }
            
            if latest_submission.helper:
                helper_data = {
                    "id": latest_submission.helper.id,
                    "name": latest_submission.helper.name,
                    "phoneNo": latest_submission.helper.phoneNo,
                    "language": latest_submission.helper.language,
                    "type": latest_submission.helper.type
                }
        
        # Get documents from DocumentControl
        documents = DocumentControl.objects.filter(
            referenceId=vehicle.id,
            type__in=['vehicle_registration', 'vehicle_insurance', 'vehicle_puc']
        ).order_by('-created')
        
        return Response({
            "vehicle": VehicleDetailsSerializer(vehicle).data,
            "driver": driver_data,
            "helper": helper_data,
            "documents": DocumentControlSerializer(documents, many=True).data
        })

    def destroy(self, request, *args, **kwargs):
        """Override delete to return custom success message"""
        vehicle = self.get_object()
        vehicle_reg_no = vehicle.vehicleRegistrationNo
        vehicle.delete()
        
        return Response({
            "message": f"Vehicle {vehicle_reg_no} deleted successfully"
        }, status=status.HTTP_200_OK)