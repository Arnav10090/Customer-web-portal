from rest_framework import serializers
from .models import VehicleDetails

class VehicleDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDetails
        fields = [
            'id', 
            'vehicle_registration_no', 
            'remark', 
            'ratings'
        ]
        read_only_fields = ['id']