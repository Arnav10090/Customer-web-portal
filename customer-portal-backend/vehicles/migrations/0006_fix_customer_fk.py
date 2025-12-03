from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0007_alter_customeruser_last_login_and_more'),
        ('vehicles', '0005_vehicledetails_customer'),  # Your last migration
    ]

    operations = [
        migrations.RunSQL(
            # Drop old constraint
            sql='ALTER TABLE "VehicleDetails" DROP CONSTRAINT IF EXISTS "VehicleDetails_customer_id_e8a65705_fk_auth_user_id";',
            reverse_sql='',  # No reverse needed
        ),
        migrations.AlterField(
            model_name='vehicledetails',
            name='customer',
            field=models.ForeignKey(
                blank=True,
                db_column='customer_id',
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='vehicles',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]