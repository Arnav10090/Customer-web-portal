from django.db import models
from django.core.validators import RegexValidator

class VehicleDetails(models.Model):
    """
    Vehicle registration and tracking information
    """
    
    vehicle_registration_no = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9\s\-]+$',
                message='Vehicle number must contain only uppercase letters, numbers, spaces, or hyphens'
            )
        ]
    )
    remark = models.TextField(blank=True, null=True)
    ratings = models.IntegerField(default=0, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'VehicleDetails'
        verbose_name = 'Vehicle Detail'
        verbose_name_plural = 'Vehicle Details'
        ordering = ['-created']

    def __str__(self):
        return self.vehicle_registration_no