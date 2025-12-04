from django.db import models
from django.conf import settings
from authentication.models import Zone

class PODetails(models.Model):
    """
    Purchase Order Details
    """
    id = models.CharField(max_length=100, primary_key=True)  # PO Number
    dapName = models.ForeignKey(
        Zone,
        on_delete=models.SET_NULL,
        null=True,  # Already set
        blank=True,  # Already set
        to_field='id',
        db_column='dapName'
    )
    customerUserId = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='purchase_orders',
        db_column='customerUserId'
    )
    expReportingTime = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'PODetails'
        verbose_name = 'PO Detail'
        verbose_name_plural = 'PO Details'
        ordering = ['-created_at']

    def __str__(self):
        return self.id