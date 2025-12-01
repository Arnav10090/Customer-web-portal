from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomerDocumentViewSet

router = DefaultRouter()
router.register(r'', CustomerDocumentViewSet, basename='document')

urlpatterns = [
    path('', include(router.urls)),
]