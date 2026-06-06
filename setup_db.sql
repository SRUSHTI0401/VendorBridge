-- Run this in PostgreSQL as superuser (postgres)
-- psql -U postgres -f setup_db.sql

CREATE USER vendorbridge WITH PASSWORD 'vendorbridge123';
CREATE DATABASE vendorbridge_db OWNER vendorbridge;
GRANT ALL PRIVILEGES ON DATABASE vendorbridge_db TO vendorbridge;

-- Connect to the database and grant schema privileges
\c vendorbridge_db
GRANT ALL ON SCHEMA public TO vendorbridge;
