from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from .models import CustomerDocument
from .serializers import CustomerDocumentSerializer, DocumentUploadSerializer
import os

class CustomerDocumentViewSet(viewsets.ModelViewSet):
    queryset = CustomerDocument.objects.filter(is_active=True)
    serializer_class = CustomerDocumentSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        """
        Filter documents by customer email
        """
        queryset = super().get_queryset()
        customer_email = self.request.query_params.get('customer_email', None)
        if customer_email:
            queryset = queryset.filter(customer_email=customer_email)
        return queryset

    @action(detail=False, methods=['post'], url_path='upload')
    def upload_document(self, request):
        """
        Upload or replace document
        File is saved to computer storage, path stored in database
        
        POST /api/documents/upload/
        
        Form Data:
        - customer_email: string
        - document_type: string
        - file: file (PDF, JPG, JPEG, PNG - max 5MB)
        - vehicle_id: int (optional)
        - driver_id: int (optional)
        
        Response:
        {
            "document": {
                "id": 1,
                "file_path": "/var/customer_portal/documents/...",
                "original_filename": "PO_12345.pdf",
                "file_size": 1048576,
                "document_type": "purchase_order"
            },
            "replaced": true/false,
            "message": "..."
        }
        """
        serializer = DocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        customer_email = serializer.validated_data['customer_email']
        document_type = serializer.validated_data['document_type']
        uploaded_file = serializer.validated_data['file']
        vehicle_id = serializer.validated_data.get('vehicle_id')
        driver_id = serializer.validated_data.get('driver_id')

        # Get vehicle and driver objects
        vehicle = None
        driver = None
        if vehicle_id:
            from vehicles.models import VehicleDetails
            try:
                vehicle = VehicleDetails.objects.get(id=vehicle_id)
            except VehicleDetails.DoesNotExist:
                pass

        if driver_id:
            from drivers.models import DriverHelper
            try:
                driver = DriverHelper.objects.get(id=driver_id)
            except DriverHelper.DoesNotExist:
                pass

        # Check if document exists (for replacement)
        existing = CustomerDocument.objects.filter(
            customer_email=customer_email,
            document_type=document_type,
            is_active=True
        ).first()

        replaced = bool(existing)

        try:
            # Replace or create - saves file to storage and stores path in DB
            new_doc = CustomerDocument.replace_document(
                customer_email=customer_email,
                document_type=document_type,
                uploaded_file=uploaded_file,
                vehicle=vehicle,
                driver=driver
            )

            return Response({
                "document": CustomerDocumentSerializer(new_doc, context={'request': request}).data,
                "replaced": replaced,
                "message": "Document replaced successfully" if replaced else "Document uploaded successfully",
                "storage_path": new_doc.file_path
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "error": f"Failed to save document: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['delete'], url_path='remove')
    def remove_document(self, request, pk=None):
        """
        Soft delete document (marks as inactive, keeps file on storage)
        
        DELETE /api/documents/{id}/remove/
        
        Query Parameters:
        - hard_delete: boolean (optional, default=false)
          If true, permanently deletes file from storage
        
        Response:
        {
            "message": "Document removed successfully"
        }
        """
        document = self.get_object()
        hard_delete = request.query_params.get('hard_delete', 'false').lower() == 'true'
        
        document.delete(hard_delete=hard_delete)

        return Response({
            "message": "Document permanently deleted" if hard_delete else "Document removed successfully",
            "hard_deleted": hard_delete
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='list')
    def list_customer_documents(self, request):
        """
        List all active documents for a customer
        
        GET /api/documents/list/?customer_email=user@example.com
        
        Response:
        {
            "count": 5,
            "documents": [
                {
                    "id": 1,
                    "file_path": "/var/customer_portal/documents/...",
                    "original_filename": "PO.pdf",
                    "file_size": 1024000,
                    "file_exists": true
                },
                ...
            ]
        }
        """
        customer_email = request.query_params.get('customer_email')
        if not customer_email:
            return Response({
                "error": "customer_email parameter is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        documents = CustomerDocument.objects.filter(
            customer_email=customer_email,
            is_active=True
        ).order_by('-uploaded_at')

        serializer = CustomerDocumentSerializer(documents, many=True, context={'request': request})
        
        return Response({
            "count": documents.count(),
            "documents": serializer.data
        })

    @action(detail=True, methods=['get'], url_path='download')
    def download_document(self, request, pk=None):
        """
        Download document file from storage
        
        GET /api/documents/{id}/download/
        
        Returns: File download response
        """
        document = self.get_object()
        
        # Check if file exists on storage
        if not document.file_exists():
            return Response({
                "error": "File not found on storage",
                "file_path": document.file_path
            }, status=status.HTTP_404_NOT_FOUND)

        try:
            # Open file from storage path
            file_handle = open(document.file_path, 'rb')
            
            # Determine content type based on extension
            content_type_map = {
                '.pdf': 'application/pdf',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
            }
            content_type = content_type_map.get(document.file_extension.lower(), 'application/octet-stream')
            
            # Return file as response
            response = FileResponse(file_handle, content_type=content_type)
            response['Content-Disposition'] = f'attachment; filename="{document.original_filename}"'
            response['Content-Length'] = document.file_size
            
            return response

        except Exception as e:
            return Response({
                "error": f"Failed to read file: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='info')
    def document_info(self, request, pk=None):
        """
        Get detailed document information
        
        GET /api/documents/{id}/info/
        
        Response:
        {
            "id": 1,
            "file_path": "/var/customer_portal/documents/...",
            "original_filename": "PO.pdf",
            "file_size": 1024000,
            "file_size_readable": "1.00 MB",
            "file_exists": true,
            "uploaded_at": "2024-01-15T10:30:00Z"
        }
        """
        document = self.get_object()
        
        # Convert bytes to human-readable format
        def format_size(bytes):
            for unit in ['B', 'KB', 'MB', 'GB']:
                if bytes < 1024.0:
                    return f"{bytes:.2f} {unit}"
                bytes /= 1024.0
            return f"{bytes:.2f} TB"
        
        return Response({
            "id": document.id,
            "customer_email": document.customer_email,
            "document_type": document.document_type,
            "document_type_display": document.get_document_type_display(),
            "file_path": document.file_path,
            "original_filename": document.original_filename,
            "file_size": document.file_size,
            "file_size_readable": format_size(document.file_size),
            "file_extension": document.file_extension,
            "file_exists": document.file_exists(),
            "is_active": document.is_active,
            "uploaded_at": document.uploaded_at,
            "updated_at": document.updated_at
        })