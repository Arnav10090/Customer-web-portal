from rest_framework import status, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import CustomerUser
from .serializers import (
    CustomerUserSerializer,
    RegisterSerializer,
    LoginSerializer
)

class AuthViewSet(viewsets.GenericViewSet):
    """
    Authentication endpoints
    """
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register new customer
        
        POST /api/auth/register/
        
        Request:
        {
            "email": "user@example.com",
            "username": "user123",
            "password": "SecurePass123",
            "phone": "+919876543210",
            "company_name": "ABC Corp"
        }
        
        Response:
        {
            "user": {...},
            "tokens": {
                "access": "...",
                "refresh": "..."
            }
        }
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": CustomerUserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def login(self, request):
        """
        Login customer
        
        POST /api/auth/login/
        
        Request:
        {
            "email": "user@example.com",
            "password": "SecurePass123"
        }
        
        Response:
        {
            "user": {...},
            "tokens": {
                "access": "...",
                "refresh": "..."
            }
        }
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Authenticate
        user = authenticate(request, username=email, password=password)
        
        if not user:
            return Response({
                "error": "Invalid credentials"
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "user": CustomerUserSerializer(user).data,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        """
        Logout customer (blacklist refresh token)
        
        POST /api/auth/logout/
        
        Request:
        {
            "refresh": "..."
        }
        """
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                "message": "Logged out successfully"
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                "error": "Invalid token"
            }, status=status.HTTP_400_BAD_REQUEST)