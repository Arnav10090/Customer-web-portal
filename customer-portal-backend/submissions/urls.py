from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GateEntrySubmissionViewSet

router = DefaultRouter()
router.register(r'', GateEntrySubmissionViewSet, basename='submission')

urlpatterns = [
    path('', include(router.urls)),
]