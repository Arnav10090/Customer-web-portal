from django.db import models
from vehicles.models import VehicleDetails
from drivers.models import DriverHelper
from django.conf import settings
import os
import shutil
from datetime import datetime

DOCUMENT_TYPES = (
    ('vehicle_registration', 'Vehicle Registration'),
    ('vehicle_insurance', 'Vehicle Insurance'),
    ('vehicle_puc', 'Vehicle PUC'),
    ('driver_aadhar', 'Driver Aadhar Card'),
    ('helper_aadhar', 'Helper Aadhar Card'),
    ('po', 'Purchase Order (PO)'),
    ('do', 'Delivery Order (DO)'),
    ('before_weighing', 'Before Weighing Receipt'),
    ('after_weighing', 'After Weighing Receipt'),
)

class DocumentControl(models.Model):
    """
    Document storage (TTMS DocumentControl table)
    """
    name = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    referenceId = models.IntegerField(null=True, blank=True)  # Can reference VehicleDetails, DriverHelper, or PODetails
    filePath = models.CharField(max_length=500)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'DocumentControl'
        verbose_name = 'Document'
        verbose_name_plural = 'Documents'
        ordering = ['-created']

    def __str__(self):
        return f"{self.name} - {self.get_type_display()}"


# Keep CustomerDocument for backward compatibility with existing API
class CustomerDocument(models.Model):
    """
    Customer document uploads (Legacy - for API compatibility)
    Files are stored in local computer/server storage
    """
    customer_email = models.EmailField(db_index=True)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPES)
    
    # Store absolute file path in database (not FileField)
    file_path = models.CharField(max_length=500, help_text="Absolute path to document file on storage")
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_extension = models.CharField(max_length=10)
    
    vehicle = models.ForeignKey(
        VehicleDetails,
        on_delete=models.CASCADE,
        related_name='documents',
        null=True,
        blank=True
    )
    driver = models.ForeignKey(
        DriverHelper,
        on_delete=models.SET_NULL,
        related_name='driver_documents',
        null=True,
        blank=True
    )
    helper = models.ForeignKey(
        DriverHelper,
        on_delete=models.SET_NULL,
        related_name='helper_documents',
        null=True,
        blank=True
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # For soft delete
    replaced_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replaces'
    )

    class Meta:
        db_table = 'CustomerDocument'
        verbose_name = 'Customer Document'
        verbose_name_plural = 'Customer Documents'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['customer_email', 'document_type']),
            models.Index(fields=['is_active']),
        ]

    def __str__(self):
        return f"{self.customer_email} - {self.get_document_type_display()}"

    @staticmethod
    def get_storage_path(customer_email, document_type):
        """
        Generate storage directory path for documents
        Path: /path/to/storage/documents/{customer_email}/{document_type}/
        """
        # Get base storage directory from settings
        base_storage = getattr(settings, 'DOCUMENT_STORAGE_PATH', '/var/customer_portal/documents/')
        
        # Sanitize email for folder name
        email_folder = customer_email.replace('@', '_at_').replace('.', '_')
        
        # Create full path
        storage_path = os.path.join(base_storage, 'documents', email_folder, document_type)
        
        # Create directory if it doesn't exist
        os.makedirs(storage_path, exist_ok=True)
        
        return storage_path

    @classmethod
    def save_file_to_storage(cls, uploaded_file, customer_email, document_type):
        """
        Save uploaded file to local storage and return file path
        
        Args:
            uploaded_file: Django UploadedFile object
            customer_email: Customer email
            document_type: Type of document
            
        Returns:
            dict: Contains file_path, original_filename, file_size, file_extension
        """
        # Get storage directory
        storage_dir = cls.get_storage_path(customer_email, document_type)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_extension = os.path.splitext(uploaded_file.name)[1]
        filename = f"{document_type}_{timestamp}{file_extension}"
        
        # Full file path
        file_path = os.path.join(storage_dir, filename)
        
        # Save file to disk
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)
        
        return {
            'file_path': file_path,
            'original_filename': uploaded_file.name,
            'file_size': uploaded_file.size,
            'file_extension': file_extension
        }

    def delete(self, using=None, keep_parents=False, hard_delete=False):
        """
        Soft delete by default, hard delete if specified
        Hard delete removes the physical file from storage
        """
        if hard_delete:
            # Delete physical file from storage
            if self.file_path and os.path.isfile(self.file_path):
                try:
                    os.remove(self.file_path)
                except OSError as e:
                    print(f"Error deleting file {self.file_path}: {e}")
            super().delete(using=using, keep_parents=keep_parents)
        else:
            # Soft delete - just mark as inactive
            self.is_active = False
            self.save()

    @classmethod
    def replace_document(cls, customer_email, document_type, uploaded_file, vehicle=None, driver=None, helper=None):
        """
        Replace old document with new one:
        - Save new file to storage
        - Mark old document as inactive
        - Create new document record with file path
        - Link via replaced_by
        
        Args:
            customer_email: Customer email
            document_type: Type of document
            uploaded_file: Django UploadedFile object
            vehicle: Vehicle instance (optional)
            driver: Driver instance (optional)
            helper: Helper instance (optional)
            vehicle: Vehicle instance (optional)
            driver: Driver instance (optional)
            
        Returns:
            CustomerDocument: New document instance
        """
        # Find existing active document
        old_doc = cls.objects.filter(
            customer_email=customer_email,
            document_type=document_type,
            is_active=True
        ).first()

        # Save file to storage and get file info
        file_info = cls.save_file_to_storage(uploaded_file, customer_email, document_type)

        # Create new document record
        new_doc = cls.objects.create(
            customer_email=customer_email,
            document_type=document_type,
            file_path=file_info['file_path'],
            original_filename=file_info['original_filename'],
            file_size=file_info['file_size'],
            file_extension=file_info['file_extension'],
            vehicle=vehicle,
            driver=driver,
            helper=helper
        )

        # Mark old document as replaced (soft delete)
        if old_doc:
            old_doc.is_active = False
            old_doc.replaced_by = new_doc
            old_doc.save()
            
            # Optionally delete old physical file to save space
            # Uncomment the following to delete old files immediately
            # if old_doc.file_path and os.path.isfile(old_doc.file_path):
            #     try:
            #         os.remove(old_doc.file_path)
            #     except OSError:
            #         pass

        return new_doc

    def get_file_url(self, request=None):
        """
        Generate URL to access the file
        In production, this would be served via nginx/Apache
        """
        if not self.is_active:
            return None
        
        # In development, Django can serve the file
        # In production, configure web server to serve from DOCUMENT_STORAGE_PATH
        if request:
            # Build URL path (requires view to serve files)
            return request.build_absolute_uri(f'/api/documents/{self.id}/download/')
        return None

    def file_exists(self):
        """
        Check if the physical file exists on storage
        """
        return os.path.isfile(self.file_path) if self.file_path else False