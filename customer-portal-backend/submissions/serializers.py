from rest_framework import serializers
from .models import GateEntrySubmission, AuditLog

class GateEntrySubmissionSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.CharField(source='vehicle.vehicle_registration_no', read_only=True)
    driver_name = serializers.CharField(source='driver.name', read_only=True)
    driver_phone = serializers.CharField(source='driver.phone_no', read_only=True)
    helper_name = serializers.CharField(source='helper.name', read_only=True)
    helper_phone = serializers.CharField(source='helper.phone_no', read_only=True)
    qr_code_url = serializers.SerializerMethodField()

    class Meta:
        model = GateEntrySubmission
        fields = [
            'id', 'customer_email', 'customer_phone',
            'vehicle_number', 'driver_name', 'driver_phone',
            'helper_name', 'helper_phone', 'qr_code_url',
            'qr_payload_hash', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'qr_payload_hash', 'created_at', 'updated_at']

    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
        return None

class SubmissionCreateSerializer(serializers.Serializer):
    customer_email = serializers.EmailField()
    customer_phone = serializers.RegexField(
        regex=r'^\+91\d{10}$',
        error_messages={'invalid': 'Phone must be in format: +91XXXXXXXXXX'}
    )
    vehicle_number = serializers.CharField(max_length=50)
    poNumber = serializers.CharField(max_length=100, required=True)
    driver_name = serializers.CharField(max_length=100)
    driver_phone = serializers.RegexField(
        regex=r'^\+91\d{10}$',
        error_messages={'invalid': 'Phone must be in format: +91XXXXXXXXXX'}
    )
    driver_language = serializers.CharField(default='en')
    helper_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    helper_phone = serializers.RegexField(
        regex=r'^\+91\d{10}$',
        required=False,
        allow_blank=True,
        error_messages={'invalid': 'Phone must be in format: +91XXXXXXXXXX'}
    )
    helper_language = serializers.CharField(default='en', required=False)

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']