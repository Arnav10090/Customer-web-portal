from rest_framework import status, viewsets
from rest_framework.decorators import action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
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
        """
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken()
        refresh['user_id'] = user.id
        refresh['email'] = user.email
        
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
        """
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            # Fetch user by email
            user = CustomerUser.objects.get(email=email)
            
            # Check password
            if not user.check_password(password):
                return Response({
                    "error": "Invalid credentials"
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Check if active
            if not user.is_active:
                return Response({
                    "error": "Account is inactive"
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Generate tokens
            refresh = RefreshToken()
            refresh['user_id'] = user.id
            refresh['email'] = user.email
            
            return Response({
                "user": CustomerUserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            })
        except CustomerUser.DoesNotExist:
            return Response({
                "error": "Invalid credentials"
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def user(self, request):
        """
        Get current authenticated user (validates token)
        
        GET /api/auth/user/
        """
        try:
            # Extract user_id from JWT token claims
            user_id = None
            if hasattr(request, 'auth') and request.auth:
                # request.auth contains the token payload
                user_id = request.auth.get('user_id')
            
            if not user_id:
                return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
            
            user = CustomerUser.objects.get(id=user_id)
            return Response(CustomerUserSerializer(user).data)
        except CustomerUser.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def logout(self, request):
        """
        Logout customer - doesn't require authentication
        
        POST /api/auth/logout/
        Body: { "refresh": "<refresh_token>" }
        """
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    # Try to blacklist if table exists, but don't fail if it doesn't
                    try:
                        token.blacklist()
                    except Exception:
                        # Token blacklist table might not exist, that's okay
                        pass
                except TokenError:
                    # Invalid token format, still logout is successful
                    pass
            
            return Response({
                "message": "Logged out successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Still return success even if there's an error
            return Response({
                "message": "Logged out successfully"
            }, status=status.HTTP_200_OK)