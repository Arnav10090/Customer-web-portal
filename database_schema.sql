CREATE TABLE "Users" (
  "id" integer PRIMARY KEY,
  "empId" varchar,
  "username" varchar UNIQUE,
  "zoneTypeName" varchar,
  "userType" varchar,
  "firstName" varchar,
  "lastName" varchar,
  "telephone" varchar UNIQUE,
  "email" varchar UNIQUE,
  "password" varchar,
  "created_at" timestamp
);

CREATE TABLE "ZoneType" (
  "typeName" varchar PRIMARY KEY,
  "standardTime" integer
);

CREATE TABLE "Zone" (
  "id" integer PRIMARY KEY,
  "zoneName" varchar,
  "typeName" varchar,
  "isWorking" boolean,
  "created_at" timestamp
);

CREATE TABLE "PODetails" (
  "id" integer PRIMARY KEY,
  "dapName" integer NOT NULL,
  "customerUserId" integer,
  "expReportingTime" datetime
);

CREATE TABLE "ParkingSpot" (
  "id" integer PRIMARY KEY,
  "zoneId" integer NOT NULL
);

CREATE TABLE "VehicleDetails" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "vehicleRegistrationNo" varchar NOT NULL,
  "remark" varchar,
  "ratings" integer
);

CREATE TABLE "DocumentControl" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "name" varchar,
  "type" varchar,
  "referenceId" integer,
  "filePath" varchar2
);

CREATE TABLE "DriverHelper" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "name" varchar NOT NULL,
  "type" varchar,
  "phoneNo" varchar NOT NULL,
  "uid" varchar UNIQUE NOT NULL,
  "language" varchar,
  "isBlacklisted" boolean,
  "rating" integer
);

CREATE TABLE "RFTags" (
  "id" integer PRIMARY KEY,
  "manufacturer" varchar,
  "isActive" boolean,
  "isDeployed" boolean
);

CREATE TABLE "DriverVehicleTagging" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "driverId" integer,
  "helperId" integer,
  "vehicleId" integer,
  "isVerified" boolean
);

CREATE TABLE "PODriverVehicleTagging" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "poId" integer,
  "driverVehicleTaggingId" integer,
  "rftagId" integer,
  "actReportingTime" datetime,
  "exitTime" datetime
);

CREATE TABLE "VehicleTracking" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "poDriverVehicleTaggingId" integer,
  "currentZoneId" integer,
  "nextZoneId" integer,
  "parkingZoneId" integer,
  "parkingSpotId" integer,
  "parkingReportingTime" datetime,
  "parkingLeavingTime" datetime,
  "currrentZoneReportingTime" datetime,
  "currentZoneLeavingTime" datetime
);

CREATE TABLE "Alarms" (
  "id" integer PRIMARY KEY,
  "created" datetime,
  "severity" varchar,
  "message" varchar2,
  "zoneId" integer,
  "vehicleId" integer,
  "isAcknowledged" boolean,
  "acknowledgedUserId" integer,
  "acknowledgedTime" datetime
);

COMMENT ON COLUMN "Users"."zoneTypeName" IS 'stations, gates, park area';

COMMENT ON COLUMN "Users"."userType" IS 'customer, employee';

COMMENT ON COLUMN "ZoneType"."typeName" IS 'stations, gates, park area, external';

COMMENT ON COLUMN "Zone"."typeName" IS 'stations, gates, park area';

COMMENT ON COLUMN "PODetails"."customerUserId" IS 'where userType == customer';

COMMENT ON COLUMN "ParkingSpot"."zoneId" IS 'zone.type == parking area';

COMMENT ON COLUMN "DocumentControl"."type" IS 'vehicle Registration, Vehicle Insurance, Vehicle PUC, Driver Adhar Card, Helper Adhar Card, PO, DO, Before Weighing Receipt, After Weighing Receipt, Other';

COMMENT ON COLUMN "DocumentControl"."referenceId" IS 'VehicleDetails.id, PODetails.id, DriverHelper.id';

COMMENT ON COLUMN "DriverHelper"."type" IS 'Driver, Helper';

COMMENT ON COLUMN "VehicleTracking"."parkingZoneId" IS 'zone.type == parking area';

COMMENT ON COLUMN "Alarms"."severity" IS 'info, warning, critical';

ALTER TABLE "Users" ADD FOREIGN KEY ("zoneTypeName") REFERENCES "ZoneType" ("typeName");

ALTER TABLE "Zone" ADD FOREIGN KEY ("typeName") REFERENCES "ZoneType" ("typeName");

ALTER TABLE "PODetails" ADD FOREIGN KEY ("dapName") REFERENCES "Zone" ("zoneName");

ALTER TABLE "PODetails" ADD FOREIGN KEY ("customerUserId") REFERENCES "Users" ("empId");

ALTER TABLE "ParkingSpot" ADD FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id");

ALTER TABLE "DriverVehicleTagging" ADD FOREIGN KEY ("driverId") REFERENCES "DriverHelper" ("id");

ALTER TABLE "DriverVehicleTagging" ADD FOREIGN KEY ("helperId") REFERENCES "DriverHelper" ("id");

ALTER TABLE "DriverVehicleTagging" ADD FOREIGN KEY ("vehicleId") REFERENCES "VehicleDetails" ("id");

ALTER TABLE "PODriverVehicleTagging" ADD FOREIGN KEY ("poId") REFERENCES "PODetails" ("id");

ALTER TABLE "PODriverVehicleTagging" ADD FOREIGN KEY ("driverVehicleTaggingId") REFERENCES "DriverVehicleTagging" ("id");

ALTER TABLE "PODriverVehicleTagging" ADD FOREIGN KEY ("rftagId") REFERENCES "RFTags" ("id");

ALTER TABLE "VehicleTracking" ADD FOREIGN KEY ("poDriverVehicleTaggingId") REFERENCES "PODriverVehicleTagging" ("id");

ALTER TABLE "VehicleTracking" ADD FOREIGN KEY ("currentZoneId") REFERENCES "Zone" ("id");

ALTER TABLE "VehicleTracking" ADD FOREIGN KEY ("nextZoneId") REFERENCES "Zone" ("id");

ALTER TABLE "VehicleTracking" ADD FOREIGN KEY ("parkingZoneId") REFERENCES "Zone" ("id");

ALTER TABLE "VehicleTracking" ADD FOREIGN KEY ("parkingSpotId") REFERENCES "ParkingSpot" ("id");

ALTER TABLE "Alarms" ADD FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id");

ALTER TABLE "Alarms" ADD FOREIGN KEY ("vehicleId") REFERENCES "VehicleDetails" ("id");

ALTER TABLE "Alarms" ADD FOREIGN KEY ("acknowledgedUserId") REFERENCES "Users" ("empId");
