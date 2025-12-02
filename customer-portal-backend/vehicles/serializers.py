from rest_framework import serializers
from .models import VehicleDetails

class VehicleDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = VehicleDetails
        fields = [
            'id', 
            'vehicle_registration_no', 
            'vehicle_type',
            'manufacturer',
            'model',
            'year',
            'color',
            'vin_number',
            'remark', 
            'ratings', 
            'created', 
            'updated'
        ]
        read_only_fields = ['id', 'created', 'updated']