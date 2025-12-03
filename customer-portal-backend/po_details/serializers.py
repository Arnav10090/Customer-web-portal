from rest_framework import serializers
from .models import PODetails

class PODetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PODetails
        fields = ['id', 'dapName', 'customerUserId', 'expReportingTime', 'created_at']
        read_only_fields = ['created_at']

class POCreateSerializer(serializers.Serializer):
    po_number = serializers.CharField(max_length=100)