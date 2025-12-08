# customer-portal-backend/drivers/models.py
from django.db import models
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

DRIVER_TYPES = (
    ('Driver', 'Driver'),
    ('Helper', 'Helper'),
)

LANGUAGE_CHOICES = (
    ('en', 'English'),
    ('hi', 'Hindi'),
    ('mr', 'Marathi'),
    ('gu', 'Gujarati'),
    ('ta', 'Tamil'),
    ('te', 'Telugu'),
    ('kn', 'Kannada'),
    ('ml', 'Malayalam'),
    ('bn', 'Bengali'),
    ('or', 'Odia'),
    ('pa', 'Punjabi'),
    ('as', 'Assamese'),
    ('ur', 'Urdu'),
    ('sa', 'Sanskrit'),
    ('mai', 'Maithili'),
)

class DriverHelper(models.Model):
    """
    Driver and Helper information (TTMS DriverHelper table)
    """
    uid = models.CharField(
        max_length=255,
        unique=True,
        help_text='Unique identifier for driver/helper (Aadhar number)'
    )
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=DRIVER_TYPES)
    phoneNo = models.CharField(
        max_length=20,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^\+91\d{10}$',
                message='Phone number must be in format: +91XXXXXXXXXX'
            )
        ]
    )
    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    isBlacklisted = models.BooleanField(default=False)
    rating = models.IntegerField(default=0, blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'DriverHelper'
        verbose_name = 'Driver/Helper'
        verbose_name_plural = 'Drivers/Helpers'
        ordering = ['-created']
        indexes = [
            models.Index(fields=['phoneNo']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.name} ({self.type}) - {self.phoneNo}"

    def clean(self):
        """
        Validation: If phone exists but name mismatch → raise error
        """
        if self.phoneNo:
            existing = DriverHelper.objects.filter(phoneNo=self.phoneNo).exclude(pk=self.pk).first()
            if existing and existing.name.lower() != self.name.lower():
                raise ValidationError(
                    f"This Phone number is already registered with a different person"
                )

    @classmethod
    def validate_or_create(cls, name, phone_no, driver_type, language='en'):
        """
        Workflow validation logic:
        - If phone exists and name matches → return existing
        - If phone exists but name mismatch → raise error
        - If phone doesn't exist → create new
        """
        try:
            existing = cls.objects.get(phoneNo=phone_no)
            if existing.name.lower() == name.lower():
                # Update language if changed
                if existing.language != language:
                    existing.language = language
                    existing.save()
                return existing, False  # (instance, created)
            else:
                raise ValidationError(
                    f"This Phone number is already registered with a different person. "
                    f"Enter a different Phone number"
                )
        except cls.DoesNotExist:
            # Create new driver/helper
            instance = cls.objects.create(
                name=name,
                phoneNo=phone_no,
                type=driver_type,
                language=language,
                isBlacklisted=False,
                rating=None
            )
            return instance, True  # (instance, created)