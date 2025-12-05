from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, Http404
from django.conf import settings
from .models import CustomerDocument, DocumentControl
from .serializers import CustomerDocumentSerializer, DocumentUploadSerializer, DocumentControlSerializer
from vehicles.models import VehicleDetails
from po_details.models import PODetails
from drivers.models import DriverHelper
import os
from datetime import datetime

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
    
    @action(detail=False, methods=['delete'], url_path='delete-from-control/(?P<document_id>[^/.]+)')
    def delete_from_document_control(self, request, document_id=None):
        """
        Delete document from DocumentControl table and remove file from storage
        
        DELETE /api/documents/delete-from-control/{document_id}/
        
        Response:
        {
            "message": "Document deleted successfully",
            "document_id": 123
        }
        """
        if not document_id:
            return Response({
                "error": "Document ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find the document in DocumentControl
            document = DocumentControl.objects.get(id=document_id)
            
            # Store file path before deletion
            file_path = document.filePath
            document_name = document.name
            document_type = document.get_type_display()
            
            # Delete the document record from database
            document.delete()
            
            # Delete the physical file from storage
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except OSError as e:
                    # Log error but don't fail the request
                    print(f"Warning: Could not delete file {file_path}: {e}")
            
            return Response({
                "message": f"{document_type} deleted successfully",
                "document_id": document_id,
                "document_name": document_name
            }, status=status.HTTP_200_OK)
        
        except DocumentControl.DoesNotExist:
            return Response({
                "error": "Document not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        except Exception as e:
            return Response({
                "error": f"Failed to delete document: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'], url_path='upload-to-control')
    def upload_to_document_control(self, request):
        """
        Upload document to DocumentControl table with local file storage
        
        POST /api/documents/upload-to-control/
        
        Form Data:
        - document_type: string (e.g., 'vehicleRegistration', 'po', etc.)
        - file: file (PDF, JPG, JPEG, PNG - max 5MB)
        - vehicle_number: string (optional - for vehicle-related docs)
        - po_number: string (optional - for PO-related docs)
        - driver_phone: string (optional - for driver-related docs)
        - helper_phone: string (optional - for helper-related docs)
        """
        # Validate file
        file = request.FILES.get('file')
        if not file:
            return Response({
                "error": "No file provided"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file type and size
        ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        MAX_SIZE = 5 * 1024 * 1024  # 5MB
        
        if file.content_type not in ACCEPTED_TYPES:
            return Response({
                "error": "Only PDF, JPG, JPEG, and PNG files are allowed"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if file.size > MAX_SIZE:
            return Response({
                "error": "File size must be 5MB or smaller"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get document type
        document_type = request.data.get('document_type')
        if not document_type:
            return Response({
                "error": "Document type is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Map frontend document types to backend types
        doc_type_mapping = {
            'vehicleRegistration': 'vehicle_registration',
            'vehicleInsurance': 'vehicle_insurance',
            'vehiclePuc': 'vehicle_puc',
            'driverAadhar': 'driver_aadhar',
            'helperAadhar': 'helper_aadhar',
            'po': 'po',
            'do': 'do',
            'beforeWeighing': 'before_weighing',
            'afterWeighing': 'after_weighing',
        }
        
        mapped_type = doc_type_mapping.get(document_type, document_type)
        
        # Determine reference ID based on document type
        reference_id = None
        
        try:
            # For vehicle-related documents
            if mapped_type in ['vehicle_registration', 'vehicle_insurance', 'vehicle_puc']:
                vehicle_number = request.data.get('vehicle_number')
                if not vehicle_number:
                    # Try to get from user's context (if available in session/token)
                    return Response({
                        "error": "Vehicle number is required for vehicle documents"
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    # Get or create vehicle to ensure it exists
                    vehicle, created = VehicleDetails.objects.get_or_create(
                        vehicleRegistrationNo=vehicle_number.strip().upper()
                    )
                    reference_id = vehicle.id
                    print(f"Vehicle ID set as referenceId: {reference_id}")  # Debug log
                except Exception as e:
                    print(f"Vehicle lookup error: {str(e)}")  # Debug log
                    return Response({
                        "error": f"Failed to find or create vehicle: {str(e)}"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # For PO/DO documents
            elif mapped_type in ['po', 'do', 'before_weighing', 'after_weighing']:
                po_number = request.data.get('po_number')
                if po_number:
                    try:
                        po, created = PODetails.objects.get_or_create(
                            id=po_number.strip().upper(),
                            defaults={'customerUserId': request.user}
                        )
                        reference_id = po.id  # Note: PODetails uses string ID
                        print(f"PO ID set as referenceId: {reference_id}")  # Debug log
                    except Exception as e:
                        print(f"PO lookup error: {str(e)}")  # Debug log
                        return Response({
                            "error": f"Failed to find or create PO: {str(e)}"
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            # For driver documents
            elif mapped_type == 'driver_aadhar':
                driver_phone = request.data.get('driver_phone')
                if driver_phone:
                    try:
                        driver = DriverHelper.objects.get(phoneNo=driver_phone, type='Driver')
                        reference_id = driver.id
                        print(f"Driver ID set as referenceId: {reference_id}")  # Debug log
                    except DriverHelper.DoesNotExist:
                        return Response({
                            "error": "Driver not found. Please add driver information first."
                        }, status=status.HTTP_400_BAD_REQUEST)
            
            # For helper documents
            elif mapped_type == 'helper_aadhar':
                helper_phone = request.data.get('helper_phone')
                if helper_phone:
                    try:
                        helper = DriverHelper.objects.get(phoneNo=helper_phone, type='Helper')
                        reference_id = helper.id
                        print(f"Helper ID set as referenceId: {reference_id}")  # Debug log
                    except DriverHelper.DoesNotExist:
                        return Response({
                            "error": "Helper not found. Please add helper information first."
                        }, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            print(f"Error determining referenceId: {str(e)}")  # Debug log
            return Response({
                "error": f"Failed to determine reference: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create storage directory
        base_storage = getattr(settings, 'DOCUMENT_STORAGE_PATH', os.path.join(settings.BASE_DIR, 'documents'))
        storage_path = os.path.join(base_storage, mapped_type)
        os.makedirs(storage_path, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(file.name)[1]
        safe_filename = f"{mapped_type}_{timestamp}{file_extension}"
        file_path = os.path.join(storage_path, safe_filename)
        
        # Save file to disk
        try:
            with open(file_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
            print(f"File saved to: {file_path}")  # Debug log
        except Exception as e:
            print(f"File save error: {str(e)}")  # Debug log
            return Response({
                "error": f"Failed to save file: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Create DocumentControl record
        try:
            document = DocumentControl.objects.create(
                name=file.name,
                type=mapped_type,
                referenceId=reference_id,  # This should NOT be null now
                filePath=file_path
            )
            
            print(f"Document created with ID: {document.id}, referenceId: {document.referenceId}")  # Debug log
            
            return Response({
                "document": DocumentControlSerializer(document).data,
                "message": "Document uploaded successfully"
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            # If database save fails, delete the file
            if os.path.exists(file_path):
                os.remove(file_path)
            
            print(f"Database save error: {str(e)}")  # Debug log
            return Response({
                "error": f"Failed to save document record: {str(e)}"
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