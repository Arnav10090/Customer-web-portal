from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PODetailsViewSet

router = DefaultRouter()
router.register(r'', PODetailsViewSet, basename='po-details')

urlpatterns = [
    path('', include(router.urls)),
]