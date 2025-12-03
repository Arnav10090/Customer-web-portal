from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password, check_password


class ZoneType(models.Model):
    """
    Zone types: stations, gates, park area, external
    """
    typeName = models.CharField(max_length=100, primary_key=True)
    standardTime = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'ZoneType'
        verbose_name = 'Zone Type'
        verbose_name_plural = 'Zone Types'

    def __str__(self):
        return self.typeName


class Zone(models.Model):
    """
    Zones in the facility: stations, gates, parking areas
    """
    zoneName = models.CharField(max_length=100)
    typeName = models.ForeignKey(ZoneType, on_delete=models.SET_NULL, null=True, blank=True, to_field='typeName')
    isWorking = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'Zone'
        verbose_name = 'Zone'
        verbose_name_plural = 'Zones'

    def __str__(self):
        return self.zoneName


class CustomerUserManager(BaseUserManager):
    """Custom manager for CustomerUser"""
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(email, password, **extra_fields)


class CustomerUser(AbstractBaseUser):
    """
    User model mapped directly to TTMS Users table
    """
    id = models.AutoField(primary_key=True)
    empId = models.CharField(max_length=100, unique=True, null=True, blank=True)
    username = models.CharField(max_length=150, unique=True)
    zoneTypeName = models.ForeignKey(
        ZoneType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        to_field='typeName',
        db_column='zoneTypeName'
    )
    userType = models.CharField(max_length=20, choices=[('customer', 'Customer'), ('employee', 'Employee')], default='customer')
    firstName = models.CharField(max_length=100, null=True, blank=True)
    lastName = models.CharField(max_length=100, null=True, blank=True)
    telephone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True)
    is_superuser = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []  # Empty because USERNAME_FIELD is email
    
    objects = CustomerUserManager()
    
    class Meta:
        db_table = 'Users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email