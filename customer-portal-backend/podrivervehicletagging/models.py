from django.db import models
from vehicles.models import VehicleDetails
from drivers.models import DriverHelper
from po_details.models import PODetails

class DriverVehicleTagging(models.Model):
    """
    Links driver, helper, and vehicle together
    """
    created = models.DateTimeField(auto_now_add=True)
    driverId = models.ForeignKey(DriverHelper, on_delete=models.CASCADE, related_name='driver_taggings', db_column='driverId')
    helperId = models.ForeignKey(DriverHelper, on_delete=models.SET_NULL, null=True, blank=True, related_name='helper_taggings', db_column='helperId')
    vehicleId = models.ForeignKey(VehicleDetails, on_delete=models.CASCADE, db_column='vehicleId')
    isVerified = models.BooleanField(default=False)

    class Meta:
        db_table = 'DriverVehicleTagging'
        verbose_name = 'Driver Vehicle Tagging'
        verbose_name_plural = 'Driver Vehicle Taggings'

    def __str__(self):
        return f"Tagging {self.id}"


class RFTags(models.Model):
    """
    RFID tags for vehicles
    """
    manufacturer = models.CharField(max_length=100, blank=True, null=True)
    isActive = models.BooleanField(default=True)
    isDeployed = models.BooleanField(default=False)

    class Meta:
        db_table = 'RFTags'
        verbose_name = 'RF Tag'
        verbose_name_plural = 'RF Tags'

    def __str__(self):
        return f"RF Tag {self.id}"


class PODriverVehicleTagging(models.Model):
    """
    Links PO with driver-vehicle tagging
    """
    created = models.DateTimeField(auto_now_add=True)
    poId = models.ForeignKey(PODetails, on_delete=models.CASCADE, db_column='poId')
    driverVehicleTaggingId = models.ForeignKey(DriverVehicleTagging, on_delete=models.CASCADE, db_column='driverVehicleTaggingId')
    rftagId = models.ForeignKey(RFTags, on_delete=models.SET_NULL, null=True, blank=True, db_column='rftagId')
    actReportingTime = models.DateTimeField(null=True, blank=True)
    exitTime = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'PODriverVehicleTagging'
        verbose_name = 'PO Driver Vehicle Tagging'
        verbose_name_plural = 'PO Driver Vehicle Taggings'

    def __str__(self):
        return f"PO Tagging {self.id}"