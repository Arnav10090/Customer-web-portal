from django.db import models
from vehicles.models import VehicleDetails
from drivers.models import DriverHelper
import hashlib
import json

class GateEntrySubmission(models.Model):
    """
    Main submission record for gate entry
    """
    # Customer info
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=15)

    # Vehicle info
    vehicle = models.ForeignKey(
        VehicleDetails,
        on_delete=models.CASCADE,
        related_name='submissions'
    )

    # Driver & Helper
    driver = models.ForeignKey(
        DriverHelper,
        on_delete=models.CASCADE,
        related_name='driver_submissions'
    )
    helper = models.ForeignKey(
        DriverHelper,
        on_delete=models.CASCADE,
        related_name='helper_submissions',
        null=True,
        blank=True
    )

    # QR Code
    qr_code_image = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    qr_payload_hash = models.CharField(max_length=64, unique=True)  # SHA-256 hash

    # Status
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'GateEntrySubmission'
        verbose_name = 'Gate Entry Submission'
        verbose_name_plural = 'Gate Entry Submissions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_email']),
            models.Index(fields=['qr_payload_hash']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f"Submission {self.id} - {self.vehicle.vehicle_registration_no}"

    def generate_payload_hash(self):
        """
        Generate SHA-256 hash of QR payload for uniqueness
        """
        payload = {
            'customer_name': self.customer_email.split('@')[0],
            'customer_email': self.customer_email,
            'driver_name': self.driver.name,
            'driver_phone': self.driver.phone_no,
            'helper_name': self.helper.name if self.helper else '',
            'helper_phone': self.helper.phone_no if self.helper else '',
            'vehicle_number': self.vehicle.vehicle_registration_no,
            'timestamp': self.created_at.isoformat() if self.created_at else '',
        }
        payload_str = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(payload_str.encode()).hexdigest()


class AuditLog(models.Model):
    """
    Audit trail for all submission activities
    """
    submission = models.ForeignKey(
        GateEntrySubmission,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=100)
    description = models.TextField()
    user_email = models.EmailField(blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'AuditLog'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - {self.timestamp}"