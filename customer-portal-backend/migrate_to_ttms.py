#!/usr/bin/env python
"""
Migration script to sync Django models with TTMS database schema
This script creates Django migrations for the updated models
Run: python manage.py makemigrations
Then: python manage.py migrate
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'customer_portal.settings')
sys.path.insert(0, os.path.dirname(__file__))

django.setup()

from django.core.management import call_command

print("=" * 60)
print("Django TTMS Schema Migration")
print("=" * 60)

# Create migrations
print("\n1. Creating migrations for model changes...")
call_command('makemigrations', 'authentication', verbosity=2)
call_command('makemigrations', 'vehicles', verbosity=2)
call_command('makemigrations', 'drivers', verbosity=2)
call_command('makemigrations', 'documents', verbosity=2)

# Apply migrations
print("\n2. Applying migrations...")
call_command('migrate', verbosity=2)

print("\n" + "=" * 60)
print("✓ Migration completed successfully!")
print("=" * 60)
