from rest_framework import serializers
from .models import CustomerUser

class CustomerUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerUser
        fields = ['id', 'email', 'username', 'firstName', 'lastName', 'telephone', 'userType', 'empId', 'date_joined']
        read_only_fields = ['id', 'date_joined']

class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    firstName = serializers.CharField(max_length=100, required=False, allow_blank=True)
    lastName = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)
    verify_password = serializers.CharField(write_only=True, min_length=8)
    telephone = serializers.CharField(max_length=20, required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['verify_password']:
            raise serializers.ValidationError({"password": "Passwords don't match"})
        
        # Check if email already exists
        if CustomerUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists"})
        
        # Check if username already exists
        if CustomerUser.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "Username already exists"})
        
        return attrs

    def create(self, validated_data):
        validated_data.pop('verify_password')
        password = validated_data.pop('password')
        
        user = CustomerUser(
            email=validated_data['email'],
            username=validated_data['username'],
            firstName=validated_data.get('firstName', ''),
            lastName=validated_data.get('lastName', ''),
            telephone=validated_data.get('telephone', ''),
            userType='customer',  # Default for registration
            empId=None,
            zoneTypeName=None,
            is_active=True
        )
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)