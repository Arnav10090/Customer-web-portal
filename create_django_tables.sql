-- Create Django system tables

CREATE TABLE IF NOT EXISTS "django_content_type" (
    "id" SERIAL PRIMARY KEY,
    "app_label" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    UNIQUE("app_label", "model")
);

CREATE TABLE IF NOT EXISTS "django_migrations" (
    "id" SERIAL PRIMARY KEY,
    "app" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "applied" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("app", "name")
);

CREATE TABLE IF NOT EXISTS "django_session" (
    "session_key" VARCHAR(40) PRIMARY KEY,
    "session_data" TEXT NOT NULL,
    "expire_date" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "django_admin_log" (
    "id" SERIAL PRIMARY KEY,
    "action_time" TIMESTAMP NOT NULL,
    "user_id" INTEGER,
    "content_type_id" INTEGER,
    "object_id" TEXT,
    "object_repr" VARCHAR(200) NOT NULL,
    "action_flag" SMALLINT NOT NULL,
    "change_message" TEXT NOT NULL,
    FOREIGN KEY ("content_type_id") REFERENCES "django_content_type"("id") ON DELETE CASCADE
);
