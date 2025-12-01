from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import CustomerUser

class CustomerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerUser
        fields = ['id', 'email', 'username', 'phone', 'company_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomerUser
        fields = ['email', 'username', 'password', 'password2', 'phone', 'company_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomerUser.objects.create_user(**validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)