#!/usr/bin/env python
"""
Script to create TTMS database tables from schema
Run this from the project root: python create_ttms_tables.py
"""

import os
import sys
import django
import psycopg2
from psycopg2 import sql

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'customer_portal.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'customer-portal-backend'))

django.setup()

from decouple import config

# Get database credentials
DB_NAME = config('DB_NAME')
DB_USER = config('DB_USER')
DB_PASSWORD = config('DB_PASSWORD')
DB_HOST = config('DB_HOST', default='localhost')
DB_PORT = config('DB_PORT', default='5432')

# SQL to create tables
CREATE_TABLES_SQL = """
-- Users table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "empId" VARCHAR UNIQUE,
  "username" VARCHAR UNIQUE NOT NULL,
  "zoneTypeName" VARCHAR,
  "userType" VARCHAR,
  "firstName" VARCHAR,
  "lastName" VARCHAR,
  "telephone" VARCHAR UNIQUE,
  "email" VARCHAR UNIQUE,
  "password" VARCHAR,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- ZoneType table
CREATE TABLE IF NOT EXISTS "ZoneType" (
  "typeName" VARCHAR PRIMARY KEY,
  "standardTime" INTEGER
);

-- Zone table
CREATE TABLE IF NOT EXISTS "Zone" (
  "id" SERIAL PRIMARY KEY,
  "zoneName" VARCHAR,
  "typeName" VARCHAR,
  "isWorking" BOOLEAN,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- PODetails table
CREATE TABLE IF NOT EXISTS "PODetails" (
  "id" SERIAL PRIMARY KEY,
  "dapName" INTEGER NOT NULL,
  "customerUserId" INTEGER,
  "expReportingTime" TIMESTAMP
);

-- ParkingSpot table
CREATE TABLE IF NOT EXISTS "ParkingSpot" (
  "id" SERIAL PRIMARY KEY,
  "zoneId" INTEGER NOT NULL
);

-- VehicleDetails table
CREATE TABLE IF NOT EXISTS "VehicleDetails" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "vehicleRegistrationNo" VARCHAR NOT NULL,
  "remark" VARCHAR,
  "ratings" INTEGER
);

-- DocumentControl table
CREATE TABLE IF NOT EXISTS "DocumentControl" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "name" VARCHAR,
  "type" VARCHAR,
  "referenceId" INTEGER,
  "filePath" VARCHAR
);

-- DriverHelper table
CREATE TABLE IF NOT EXISTS "DriverHelper" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "name" VARCHAR,
  "type" VARCHAR,
  "phoneNo" VARCHAR,
  "language" VARCHAR,
  "isBlacklisted" BOOLEAN,
  "rating" INTEGER
);

-- RFTags table
CREATE TABLE IF NOT EXISTS "RFTags" (
  "id" SERIAL PRIMARY KEY,
  "manufacturer" VARCHAR,
  "isActive" BOOLEAN,
  "isDeployed" BOOLEAN
);

-- DriverVehicleTagging table
CREATE TABLE IF NOT EXISTS "DriverVehicleTagging" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "driverId" INTEGER,
  "helperId" INTEGER,
  "vehicleId" INTEGER,
  "isVerified" BOOLEAN
);

-- PODriverVehicleTagging table
CREATE TABLE IF NOT EXISTS "PODriverVehicleTagging" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "poId" INTEGER,
  "driverVehicleTaggingId" INTEGER,
  "rftagId" INTEGER,
  "actReportingTime" TIMESTAMP,
  "exitTime" TIMESTAMP
);

-- VehicleTracking table
CREATE TABLE IF NOT EXISTS "VehicleTracking" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "poDriverVehicleTaggingId" INTEGER,
  "currentZoneId" INTEGER,
  "nextZoneId" INTEGER,
  "parkingZoneId" INTEGER,
  "parkingSpotId" INTEGER,
  "parkingReportingTime" TIMESTAMP,
  "parkingLeavingTime" TIMESTAMP,
  "currrentZoneReportingTime" TIMESTAMP,
  "currentZoneLeavingTime" TIMESTAMP
);

-- Alarms table
CREATE TABLE IF NOT EXISTS "Alarms" (
  "id" SERIAL PRIMARY KEY,
  "created" TIMESTAMP DEFAULT NOW(),
  "severity" VARCHAR,
  "message" VARCHAR,
  "zoneId" INTEGER,
  "vehicleId" INTEGER,
  "isAcknowledged" BOOLEAN,
  "acknowledgedUserId" INTEGER,
  "acknowledgedTime" TIMESTAMP
);

-- Add Foreign Keys
ALTER TABLE "Users" ADD CONSTRAINT fk_users_zonetype 
FOREIGN KEY ("zoneTypeName") REFERENCES "ZoneType" ("typeName")
ON DELETE SET NULL;

ALTER TABLE "Zone" ADD CONSTRAINT fk_zone_zonetype 
FOREIGN KEY ("typeName") REFERENCES "ZoneType" ("typeName")
ON DELETE SET NULL;

ALTER TABLE "PODetails" ADD CONSTRAINT fk_podetails_zone 
FOREIGN KEY ("dapName") REFERENCES "Zone" ("id")
ON DELETE SET NULL;

ALTER TABLE "PODetails" ADD CONSTRAINT fk_podetails_users 
FOREIGN KEY ("customerUserId") REFERENCES "Users" ("id")
ON DELETE SET NULL;

ALTER TABLE "ParkingSpot" ADD CONSTRAINT fk_parkingspot_zone 
FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id")
ON DELETE CASCADE;

ALTER TABLE "DriverVehicleTagging" ADD CONSTRAINT fk_dvt_driver 
FOREIGN KEY ("driverId") REFERENCES "DriverHelper" ("id")
ON DELETE SET NULL;

ALTER TABLE "DriverVehicleTagging" ADD CONSTRAINT fk_dvt_helper 
FOREIGN KEY ("helperId") REFERENCES "DriverHelper" ("id")
ON DELETE SET NULL;

ALTER TABLE "DriverVehicleTagging" ADD CONSTRAINT fk_dvt_vehicle 
FOREIGN KEY ("vehicleId") REFERENCES "VehicleDetails" ("id")
ON DELETE CASCADE;

ALTER TABLE "PODriverVehicleTagging" ADD CONSTRAINT fk_podvt_po 
FOREIGN KEY ("poId") REFERENCES "PODetails" ("id")
ON DELETE CASCADE;

ALTER TABLE "PODriverVehicleTagging" ADD CONSTRAINT fk_podvt_dvt 
FOREIGN KEY ("driverVehicleTaggingId") REFERENCES "DriverVehicleTagging" ("id")
ON DELETE CASCADE;

ALTER TABLE "PODriverVehicleTagging" ADD CONSTRAINT fk_podvt_rftag 
FOREIGN KEY ("rftagId") REFERENCES "RFTags" ("id")
ON DELETE SET NULL;

ALTER TABLE "VehicleTracking" ADD CONSTRAINT fk_vt_podvt 
FOREIGN KEY ("poDriverVehicleTaggingId") REFERENCES "PODriverVehicleTagging" ("id")
ON DELETE CASCADE;

ALTER TABLE "VehicleTracking" ADD CONSTRAINT fk_vt_currentzone 
FOREIGN KEY ("currentZoneId") REFERENCES "Zone" ("id")
ON DELETE SET NULL;

ALTER TABLE "VehicleTracking" ADD CONSTRAINT fk_vt_nextzone 
FOREIGN KEY ("nextZoneId") REFERENCES "Zone" ("id")
ON DELETE SET NULL;

ALTER TABLE "VehicleTracking" ADD CONSTRAINT fk_vt_parkingzone 
FOREIGN KEY ("parkingZoneId") REFERENCES "Zone" ("id")
ON DELETE SET NULL;

ALTER TABLE "VehicleTracking" ADD CONSTRAINT fk_vt_parkingspot 
FOREIGN KEY ("parkingSpotId") REFERENCES "ParkingSpot" ("id")
ON DELETE SET NULL;

ALTER TABLE "Alarms" ADD CONSTRAINT fk_alarms_zone 
FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id")
ON DELETE SET NULL;

ALTER TABLE "Alarms" ADD CONSTRAINT fk_alarms_vehicle 
FOREIGN KEY ("vehicleId") REFERENCES "VehicleDetails" ("id")
ON DELETE SET NULL;

ALTER TABLE "Alarms" ADD CONSTRAINT fk_alarms_user 
FOREIGN KEY ("acknowledgedUserId") REFERENCES "Users" ("id")
ON DELETE SET NULL;
"""

def create_ttms_tables():
    """Create TTMS database tables"""
    try:
        print(f"Connecting to PostgreSQL: {DB_HOST}:{DB_PORT}")
        print(f"Database: {DB_NAME}")
        print(f"User: {DB_USER}")
        
        # Connect to database
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        
        cursor = conn.cursor()
        
        print("\n✓ Connected successfully!")
        print("\nCreating tables...\n")
        
        # Execute the SQL
        cursor.execute(CREATE_TABLES_SQL)
        conn.commit()
        
        print("✓ All tables created successfully!")
        
        # Get table count
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        table_count = cursor.fetchone()[0]
        print(f"✓ Total tables in database: {table_count}")
        
        # List all tables
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        print("\nTables created:")
        for (table_name,) in cursor.fetchall():
            print(f"  • {table_name}")
        
        cursor.close()
        conn.close()
        
        print("\n✓ Database setup complete!")
        return True
        
    except psycopg2.Error as e:
        print(f"✗ Database error: {e}")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == "__main__":
    success = create_ttms_tables()
    sys.exit(0 if success else 1)
