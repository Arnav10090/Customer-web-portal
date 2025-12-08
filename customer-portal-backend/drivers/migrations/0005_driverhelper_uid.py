# Generated migration to add uid column to DriverHelper table

from django.db import migrations, models
import uuid


def populate_uid(apps, schema_editor):
    """Populate uid with unique values for existing records"""
    DriverHelper = apps.get_model('drivers', 'DriverHelper')
    for driver in DriverHelper.objects.all():
        driver.uid = str(uuid.uuid4())
        driver.save(update_fields=['uid'])


class Migration(migrations.Migration):

    dependencies = [
        ('drivers', '0004_remove_driverhelper_customer_and_more'),
    ]

    operations = [
        # First, add the field as nullable with no default
        migrations.AddField(
            model_name='driverhelper',
            name='uid',
            field=models.CharField(
                max_length=255,
                null=True,
                blank=True
            ),
        ),
        # Populate uid for existing records with unique UUIDs
        migrations.RunPython(populate_uid, migrations.RunPython.noop),
        # Finally, alter the field to make it unique and not null
        migrations.AlterField(
            model_name='driverhelper',
            name='uid',
            field=models.CharField(
                default=uuid.uuid4,
                help_text='Unique identifier for driver/helper',
                max_length=255,
                unique=True
            ),
        ),
    ]
