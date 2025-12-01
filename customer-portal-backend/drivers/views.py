from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from .models import DriverHelper
from .serializers import DriverHelperSerializer, DriverHelperValidateSerializer

class DriverHelperViewSet(viewsets.ModelViewSet):
    queryset = DriverHelper.objects.all()
    serializer_class = DriverHelperSerializer

    @action(detail=False, methods=['post'], url_path='validate-or-create')
    def validate_or_create(self, request):
        """
        Validate phone uniqueness and create if needed
        
        POST /api/drivers/validate-or-create/
        
        Request:
        {
            "name": "John Doe",
            "phone_no": "+919876543210",
            "type": "Driver",
            "language": "en"
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
        phone_no = serializer.validated_data['phone_no']
        driver_type = serializer.validated_data['type']
        language = serializer.validated_data.get('language', 'en')

        try:
            instance, created = DriverHelper.validate_or_create(
                name=name,
                phone_no=phone_no,
                driver_type=driver_type,
                language=language
            )

            message = "New driver/helper created" if created else "Existing driver/helper found"

            return Response({
                "driver": DriverHelperSerializer(instance).data,
                "created": created,
                "message": message
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

        except ValidationError as e:
            return Response({
                "error": str(e.message)
            }, status=status.HTTP_400_BAD_REQUEST)