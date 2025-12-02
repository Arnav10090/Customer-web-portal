from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomerUser

class CustomerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerUser
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'phone', 'company_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    verify_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomerUser
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'verify_password', 'phone', 'company_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['verify_password']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('verify_password')
        user = CustomerUser.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)