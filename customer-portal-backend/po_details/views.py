from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import PODetails
from .serializers import PODetailsSerializer, POCreateSerializer

class PODetailsViewSet(viewsets.ModelViewSet):
    queryset = PODetails.objects.all()
    serializer_class = PODetailsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter POs by current user
        """
        return PODetails.objects.filter(customerUserId=self.request.user)

    @action(detail=False, methods=['post'], url_path='create')
    def create_or_get_po(self, request):
        """
        Create PO if doesn't exist, or get existing PO
        
        POST /api/po-details/create/
        Body: {
            "po_number": "PO12345"
        }
        """
        serializer = POCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        po_number = serializer.validated_data['po_number'].strip().upper()
        
        # Get or create PO - ALWAYS associate with current user
        po, created = PODetails.objects.get_or_create(
            id=po_number,
            defaults={
                'customerUserId': request.user
            }
        )
        
        # If PO exists but has no customer, assign current user
        if not created and not po.customerUserId:
            po.customerUserId = request.user
            po.save()
        
        # If PO exists and belongs to a different customer, create error message
        if not created and po.customerUserId != request.user:
            return Response({
                "error": f"PO {po_number} is already associated with another customer",
                "po": None,
                "created": False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            "po": PODetailsSerializer(po).data,
            "created": created,
            "message": "New PO created" if created else "Existing PO found"
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='my-pos')
    def my_pos(self, request):
        """
        Get all POs for current user
        """
        pos = PODetails.objects.filter(
            customerUserId=request.user
        ).order_by('-created_at')
        
        serializer = PODetailsSerializer(pos, many=True)
        return Response({
            "pos": serializer.data,
            "count": pos.count()
        })