from rest_framework import serializers
from .models import CustomerDocument, DocumentControl

class DocumentControlSerializer(serializers.ModelSerializer):
    """Serializer for DocumentControl model"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = DocumentControl
        fields = ['id', 'name', 'type', 'type_display', 'referenceId', 'filePath', 'created']
        read_only_fields = ['id', 'created']

class CustomerDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_exists = serializers.SerializerMethodField()
    file_size_readable = serializers.SerializerMethodField()

    class Meta:
        model = CustomerDocument
        fields = [
            'id', 'customer_email', 'document_type', 'document_type_display',
            'file_path', 'original_filename', 'file_size', 'file_size_readable',
            'file_extension', 'file_url', 'file_exists', 'vehicle', 'driver', 'helper',
            'uploaded_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'uploaded_at', 'updated_at']

    def get_file_url(self, obj):
        """
        Return download URL for the document
        """
        request = self.context.get('request')
        if request and obj.is_active:
            return request.build_absolute_uri(f'/api/documents/{obj.id}/download/')
        return None

    def get_file_exists(self, obj):
        """
        Check if file exists on storage
        """
        return obj.file_exists()

    def get_file_size_readable(self, obj):
        """
        Convert file size to human-readable format
        """
        bytes = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes < 1024.0:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024.0
        return f"{bytes:.2f} TB"

class DocumentUploadSerializer(serializers.Serializer):
    customer_email = serializers.EmailField()
    document_type = serializers.ChoiceField(choices=[
        ('purchase_order', 'Purchase Order'),
        ('vehicle_registration', 'Vehicle Registration'),
        ('vehicle_insurance', 'Vehicle Insurance'),
        ('puc', 'PUC'),
        ('driver_license', 'Driver License'),
        ('transportation_approval', 'Transportation Approval'),
        ('payment_approval', 'Payment Approval'),
        ('vendor_approval', 'Vendor Approval'),
    ])
    file = serializers.FileField()
    vehicle_id = serializers.IntegerField(required=False)
    driver_id = serializers.IntegerField(required=False)
    helper_id = serializers.IntegerField(required=False)

    def validate_file(self, value):
        """
        Validate file size and type
        """
        # Maximum file size: 5MB
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must be under 5MB")

        # Allowed file types
        allowed_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Only PDF, JPG, JPEG, and PNG files are allowed")

        # Validate file extension
        import os
        ext = os.path.splitext(value.name)[1].lower()
        allowed_extensions = ['.pdf', '.jpg', '.jpeg', '.png']
        if ext not in allowed_extensions:
            raise serializers.ValidationError(f"File extension {ext} is not allowed")

        return value