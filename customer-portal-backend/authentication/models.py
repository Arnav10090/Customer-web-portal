from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomerUser(AbstractUser):
    """
    Extended user model for customers
    """
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    company_name = models.CharField(max_length=200, blank=True, null=True)
    
    # Use email as username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'CustomerUser'
        verbose_name = 'Customer User'
        verbose_name_plural = 'Customer Users'

    def __str__(self):
        return self.email