from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework import status
from rest_framework.response import Response
from .views import AuthViewSet

class DebugTokenRefreshView(TokenRefreshView):
    """Wrapped TokenRefreshView with debugging for 'User not found' errors"""
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            # Log the error for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"TokenRefreshView error: {str(e)}, request data: {request.data}")
            raise

router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
    path('token/refresh/', DebugTokenRefreshView.as_view(), name='token_refresh'),
]