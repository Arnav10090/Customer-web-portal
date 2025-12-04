from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0004_documentcontrol'),
    ]

    operations = [
        # Ensure the replaced_by field is properly set up
        migrations.AlterField(
            model_name='customerdocument',
            name='replaced_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='replaces',
                to='documents.customerdocument'
            ),
        ),
    ]