from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DriverHelperViewSet

router = DefaultRouter()
router.register(r'', DriverHelperViewSet, basename='driver-helper')

urlpatterns = [
    path('', include(router.urls)),
]