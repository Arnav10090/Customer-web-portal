from django.db import models
from django.core.validators import RegexValidator

class VehicleDetails(models.Model):
    """
    Vehicle registration and tracking information
    """
    VEHICLE_TYPE_CHOICES = [
        ('truck', 'Truck'),
        ('car', 'Car'),
        ('bus', 'Bus'),
        ('van', 'Van'),
        ('motorcycle', 'Motorcycle'),
        ('other', 'Other'),
    ]
    
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
    vehicle_type = models.CharField(
        max_length=20,
        choices=VEHICLE_TYPE_CHOICES,
        blank=True,
        null=True
    )
    manufacturer = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    vin_number = models.CharField(max_length=100, blank=True, null=True, unique=True)
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