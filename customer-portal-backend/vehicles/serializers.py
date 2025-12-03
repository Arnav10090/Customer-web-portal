from rest_framework import serializers
from .models import VehicleDetails
from drivers.models import DriverHelper
from documents.models import CustomerDocument


class DriverHelperSerializer(serializers.ModelSerializer):
    """Serializer for Driver/Helper information"""
    class Meta:
        model = DriverHelper
        fields = [
            'id',
            'name',
            'type',
            'phoneNo',
            'language',
            'isBlacklisted',
            'rating'
        ]
        read_only_fields = ['id']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents"""
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    
    class Meta:
        model = CustomerDocument
        fields = [
            'id',
            'document_type',
            'document_type_display',
            'original_filename',
            'file_size',
            'file_extension',
            'uploaded_at',
            'is_active'
        ]
        read_only_fields = ['id', 'uploaded_at']


class VehicleDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDetails
        fields = [
            'id', 
            'vehicleRegistrationNo', 
            'remark', 
            'ratings'
        ]
        read_only_fields = ['id']


class VehicleWithRelationsSerializer(serializers.ModelSerializer):
    """Complete vehicle data with all related driver, helper, and documents"""
    drivers = DriverHelperSerializer(
        source='driverhelper_set.filter(type="Driver")',
        many=True,
        read_only=True
    )
    helpers = DriverHelperSerializer(
        source='driverhelper_set.filter(type="Helper")',
        many=True,
        read_only=True
    )
    documents = DocumentSerializer(
        many=True,
        read_only=True
    )
    
    class Meta:
        model = VehicleDetails
        fields = [
            'id',
            'vehicleRegistrationNo',
            'remark',
            'ratings',
            'drivers',
            'helpers',
            'documents',
            'created'
        ]
        read_only_fields = ['id', 'created']