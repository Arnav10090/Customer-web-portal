from rest_framework import serializers
from .models import DriverHelper

class DriverHelperSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverHelper
        fields = ['id', 'name', 'type', 'phone_no', 'language', 'is_blacklisted', 'rating', 'created']
        read_only_fields = ['id', 'created']

class DriverHelperValidateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    phone_no = serializers.RegexField(
        regex=r'^\+91\d{10}$',
        error_messages={'invalid': 'Phone number must be in format: +91XXXXXXXXXX'}
    )
    type = serializers.ChoiceField(choices=['Driver', 'Helper'])
    language = serializers.CharField(default='en')