-- PostgreSQL Migration: Initial Schema Setup for Qiandao Biometric SDK
-- This script creates all necessary tables for the biometric device synchronization system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Device table
CREATE TABLE IF NOT EXISTS device (
    id SERIAL PRIMARY KEY,
    serial_num VARCHAR(255) UNIQUE,
    status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Person table
CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    roll_id VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollinfo table (biometric enrollment information)
CREATE TABLE IF NOT EXISTS enrollinfo (
    id SERIAL PRIMARY KEY,
    enroll_id BIGINT UNIQUE,
    backupnum INTEGER,
    imagepath TEXT,
    signatures TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Record table (attendance logs)
CREATE TABLE IF NOT EXISTS record (
    id SERIAL PRIMARY KEY,
    enroll_id BIGINT,
    device_serial_num VARCHAR(255),
    records_time TIMESTAMP,
    intout INTEGER,
    event INTEGER,
    mode INTEGER,
    temperature DECIMAL(5,2),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access_day table (daily access schedule)
CREATE TABLE IF NOT EXISTS access_day (
    id SERIAL PRIMARY KEY,
    day_of_week INTEGER,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access_week table (weekly access schedule)
CREATE TABLE IF NOT EXISTS access_week (
    id SERIAL PRIMARY KEY,
    week_number INTEGER,
    access_day_id INTEGER REFERENCES access_day(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Machine_command table (commands sent to devices)
CREATE TABLE IF NOT EXISTS machine_command (
    id SERIAL PRIMARY KEY,
    serial VARCHAR(255),
    name VARCHAR(255),
    content TEXT,
    status INTEGER DEFAULT 0,
    send_status INTEGER DEFAULT 0,
    err_count INTEGER DEFAULT 0,
    run_time TIMESTAMP,
    gmt_crate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gmt_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application logs table (for Serilog)
CREATE TABLE IF NOT EXISTS application_logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(128) NOT NULL,
    message_template TEXT,
    message TEXT,
    exception TEXT,
    properties JSONB,
    source_context VARCHAR(255)
);

-- Biometric sync logs table (tracks synchronization operations)
CREATE TABLE IF NOT EXISTS biometric_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    device_sn VARCHAR(255),
    status VARCHAR(50),
    records_synced INTEGER DEFAULT 0,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_serial_num ON device(serial_num);
CREATE INDEX IF NOT EXISTS idx_record_device_serial ON record(device_serial_num);
CREATE INDEX IF NOT EXISTS idx_record_enroll_id ON record(enroll_id);
CREATE INDEX IF NOT EXISTS idx_record_records_time ON record(records_time);
CREATE INDEX IF NOT EXISTS idx_enrollinfo_enroll_id ON enrollinfo(enroll_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_sync_logs_device_sn ON biometric_sync_logs(device_sn);
CREATE INDEX IF NOT EXISTS idx_sync_logs_synced_at ON biometric_sync_logs(synced_at);

-- Grant necessary permissions if using a specific user
-- Uncomment and adjust user names as needed:
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qiandao_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qiandao_user;

COMMIT;
