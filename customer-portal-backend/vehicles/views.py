from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import VehicleDetails
from .serializers import VehicleDetailsSerializer
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
        vehicles = (
            VehicleDetails.objects
            .filter(customer=request.user)
            .distinct()
            .order_by('-created')
        )

        serializer = VehicleDetailsSerializer(vehicles, many=True)
        return Response({
            "vehicles": serializer.data,
            "count": vehicles.count()
        })

    @action(detail=False, methods=['post'], url_path='create')
    def create_or_get_vehicle(self, request):
        """
        Create vehicle if doesn't exist, or get existing vehicle with complete data
        """
        vehicle_number = request.data.get('vehicle_number', '').strip().upper()

        if not vehicle_number:
            return Response(
                {"error": "Vehicle number is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        vehicle, created = VehicleDetails.objects.get_or_create(
            vehicleRegistrationNo=vehicle_number,
            defaults={'customer': request.user}
        )

        if not created and not vehicle.customer:
            vehicle.customer = request.user
            vehicle.save()

        from podrivervehicletagging.models import DriverVehicleTagging, PODriverVehicleTagging

        latest_tagging = (
            DriverVehicleTagging.objects
            .filter(vehicleId=vehicle)
            .select_related('driverId', 'helperId')
            .order_by('-created')
            .first()
        )

        driver_data = None
        helper_data = None
        po_number = None
        documents = []

        if latest_tagging:
            if latest_tagging.driverId:
                driver = latest_tagging.driverId
                driver_data = {
                    "id": driver.id,
                    "name": driver.name,
                    "phoneNo": driver.phoneNo,
                    "language": driver.language,
                    "type": driver.type,
                    "uid": driver.uid,
                }

            if latest_tagging.helperId:
                helper = latest_tagging.helperId
                helper_data = {
                    "id": helper.id,
                    "name": helper.name,
                    "phoneNo": helper.phoneNo,
                    "language": helper.language,
                    "type": helper.type,
                    "uid": helper.uid,
                }

            po_tagging = (
                PODriverVehicleTagging.objects
                .filter(driverVehicleTaggingId=latest_tagging)
                .select_related('poId')
                .order_by('-created')
                .first()
            )

            if po_tagging and po_tagging.poId:
                po_number = po_tagging.poId.id

        documents.extend(
            DocumentControl.objects.filter(
                referenceId=vehicle.id,
                type__in=['vehicle_registration', 'vehicle_insurance', 'vehicle_puc']
            ).order_by('-created')
        )

        if driver_data:
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=driver_data['id'],
                    type='driver_aadhar'
                )
            )

        if helper_data:
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=helper_data['id'],
                    type='helper_aadhar'
                )
            )

        if po_number:
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=po_number,
                    type__in=['po', 'do', 'before_weighing', 'after_weighing']
                )
            )

        return Response({
            "vehicle": VehicleDetailsSerializer(vehicle).data,
            "driver": driver_data,
            "helper": helper_data,
            "po_number": po_number,
            "documents": DocumentControlSerializer(documents, many=True).data,
            "created": created,
            "message": "New vehicle created" if created else "Existing vehicle found"
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='vehicle-complete-data')
    def vehicle_complete_data(self, request):
        """
        Get complete data for a specific vehicle
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

        from podrivervehicletagging.models import DriverVehicleTagging, PODriverVehicleTagging

        taggings = (
            DriverVehicleTagging.objects
            .filter(vehicleId=vehicle)
            .select_related('driverId', 'helperId')
            .order_by('-created')
        )
        
        drivers = {}
        helpers = {}

        for tagging in taggings:
            if tagging.driverId:
                drivers.setdefault(tagging.driverId.id, {
                    "id": tagging.driverId.id,
                    "name": tagging.driverId.name,
                    "phoneNo": tagging.driverId.phoneNo,
                    "language": tagging.driverId.language,
                    "type": tagging.driverId.type,
                    "uid": tagging.driverId.uid,
                })

            if tagging.helperId:
                helpers.setdefault(tagging.helperId.id, {
                    "id": tagging.helperId.id,
                    "name": tagging.helperId.name,
                    "phoneNo": tagging.helperId.phoneNo,
                    "language": tagging.helperId.language,
                    "type": tagging.helperId.type,
                    "uid": tagging.helperId.uid,
                })

        latest_tagging = taggings.first()
        po_number = None

        if latest_tagging:
            po_tagging = (
                PODriverVehicleTagging.objects
                .filter(driverVehicleTaggingId=latest_tagging)
                .select_related('poId')
                .order_by('-created')
                .first()
            )
            if po_tagging and po_tagging.poId:
                po_number = po_tagging.poId.id

        documents = list(
            DocumentControl.objects.filter(
                referenceId=vehicle.id,
                type__in=['vehicle_registration', 'vehicle_insurance', 'vehicle_puc']
            )
        )

        for driver in drivers.values():
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=driver['id'],
                    type='driver_aadhar'
                )
            )

        for helper in helpers.values():
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=helper['id'],
                    type='helper_aadhar'
                )
            )

        if po_number:
            documents.extend(
                DocumentControl.objects.filter(
                    referenceId=po_number,
                    type__in=['po', 'do', 'before_weighing', 'after_weighing']
                )
            )

        return Response({
            "vehicle": VehicleDetailsSerializer(vehicle).data,
            "drivers": list(drivers.values()),
            "helpers": list(helpers.values()),
            "po_number": po_number,
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
