import os
import django
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'customer_portal.settings')
django.setup()

# Connect and create tables
try:
    conn = psycopg2.connect(
        dbname=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', '5432')
    )
    cur = conn.cursor()
    
    # Create django_content_type table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "django_content_type" (
            "id" SERIAL PRIMARY KEY,
            "app_label" VARCHAR(100) NOT NULL,
            "model" VARCHAR(100) NOT NULL,
            UNIQUE("app_label", "model")
        );
    ''')
    
    # Create auth_permission table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_permission" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "content_type_id" INTEGER NOT NULL,
            "codename" VARCHAR(100) NOT NULL,
            UNIQUE("content_type_id", "codename"),
            FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE CASCADE
        );
    ''')
    
    # Create auth_user table (simplified, not used but needed by Django)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_user" (
            "id" SERIAL PRIMARY KEY,
            "password" VARCHAR(128) NOT NULL,
            "last_login" TIMESTAMP NULL,
            "is_superuser" BOOLEAN NOT NULL,
            "username" VARCHAR(150) NOT NULL UNIQUE,
            "first_name" VARCHAR(150) NOT NULL,
            "last_name" VARCHAR(150) NOT NULL,
            "email" VARCHAR(254) NOT NULL,
            "is_staff" BOOLEAN NOT NULL,
            "is_active" BOOLEAN NOT NULL,
            "date_joined" TIMESTAMP NOT NULL
        );
    ''')
    
    # Create auth_group table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_group" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(150) NOT NULL UNIQUE
        );
    ''')
    
    # Create auth_group_permissions table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_group_permissions" (
            "id" SERIAL PRIMARY KEY,
            "group_id" INTEGER NOT NULL,
            "permission_id" INTEGER NOT NULL,
            UNIQUE("group_id", "permission_id"),
            FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE CASCADE,
            FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE CASCADE
        );
    ''')
    
    # Create auth_user_groups table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_user_groups" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL,
            "group_id" INTEGER NOT NULL,
            UNIQUE("user_id", "group_id"),
            FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE,
            FOREIGN KEY ("group_id") REFERENCES "auth_group"("id") ON DELETE CASCADE
        );
    ''')
    
    # Create auth_user_user_permissions table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "auth_user_user_permissions" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL,
            "permission_id" INTEGER NOT NULL,
            UNIQUE("user_id", "permission_id"),
            FOREIGN KEY ("user_id") REFERENCES "auth_user"("id") ON DELETE CASCADE,
            FOREIGN KEY ("permission_id") REFERENCES "auth_permission"("id") ON DELETE CASCADE
        );
    ''')
    
    # Create django_migrations table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "django_migrations" (
            "id" SERIAL PRIMARY KEY,
            "app" VARCHAR(255) NOT NULL,
            "name" VARCHAR(255) NOT NULL,
            "applied" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE("app", "name")
        );
    ''')
    
    # Create django_session table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS "django_session" (
            "session_key" VARCHAR(40) PRIMARY KEY,
            "session_data" TEXT NOT NULL,
            "expire_date" TIMESTAMP NOT NULL
        );
    ''')
    
    conn.commit()
    cur.close()
    conn.close()
    print("Django system tables created successfully!")
except Exception as e:
    print(f"Error: {e}")
