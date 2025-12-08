# Generated migration to make uid field non-nullable and always required

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('drivers', '0006_alter_driverhelper_uid'),
    ]

    operations = [
        migrations.AlterField(
            model_name='driverhelper',
            name='uid',
            field=models.CharField(
                help_text='Unique identifier for driver/helper (Aadhar number)',
                max_length=255,
                unique=True
            ),
        ),
    ]
