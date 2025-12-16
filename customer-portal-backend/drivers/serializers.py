# customer-portal-backend/drivers/serializers.py
from rest_framework import serializers
from .models import DriverHelper

class DriverHelperSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverHelper
        fields = ['id', 'uid', 'name', 'type', 'phoneNo', 'language', 'isBlacklisted', 'rating', 'created']
        read_only_fields = ['id', 'created']

class DriverHelperValidateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    phoneNo = serializers.RegexField(
        regex=r'^\+91\d{10}$',
        error_messages={'invalid': 'Phone number must be in format: +91XXXXXXXXXX'}
    )
    type = serializers.ChoiceField(choices=['Driver', 'Helper'])
    language = serializers.CharField(default='en')
    uid = serializers.CharField(
        required=True,  # Make it required
        max_length=255,
        help_text='Unique identifier (Aadhar number)'
    )
    
    def validate_uid(self, value):
        """Validate Aadhar number format"""
        if not value or not value.strip():
            raise serializers.ValidationError("Aadhar number is required")
        
        # Remove any spaces or dashes
        cleaned = value.replace(' ', '').replace('-', '')
        
        # Check if it's 12 digits
        if not cleaned.isdigit() or len(cleaned) != 12:
            raise serializers.ValidationError("Aadhar number must be exactly 12 digits")
        
        return cleaned