# Generated migration to alter uid field to accept manual input (Aadhar number)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drivers', '0005_driverhelper_uid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='driverhelper',
            name='uid',
            field=models.CharField(
                blank=True,
                help_text='Unique identifier for driver/helper (Aadhar number)',
                max_length=255,
                null=True,
                unique=True
            ),
        ),
    ]
