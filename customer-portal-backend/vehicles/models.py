from django.db import models
from django.core.validators import RegexValidator
from django.conf import settings

class VehicleDetails(models.Model):
    """
    Vehicle registration and tracking information
    """
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles',
        null=True,
        blank=True,
        db_column='customer_id'
    )
    vehicleRegistrationNo = models.CharField(
        max_length=50,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9\s\-]+$',
                message='Vehicle number must contain only uppercase letters, numbers, spaces, or hyphens'
            )
        ]
    )
    remark = models.CharField(max_length=500, blank=True, null=True)
    ratings = models.IntegerField(default=0, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'VehicleDetails'
        verbose_name = 'Vehicle Detail'
        verbose_name_plural = 'Vehicle Details'
        ordering = ['-created']

    def __str__(self):
        return self.vehicleRegistrationNo