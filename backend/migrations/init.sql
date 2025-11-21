-- TinyLink Database Schema
-- This migration is idempotent and can be run multiple times safely

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create links table
CREATE TABLE IF NOT EXISTS links (
    code VARCHAR(8) PRIMARY KEY,
    target_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    total_clicks INTEGER DEFAULT 0,
    last_clicked TIMESTAMP WITH TIME ZONE NULL,
    owner_id TEXT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create index for active links
CREATE INDEX IF NOT EXISTS idx_links_active ON links(is_active) WHERE is_active = true;

-- Create index for owner lookups
CREATE INDEX IF NOT EXISTS idx_links_owner ON links(owner_id) WHERE owner_id IS NOT NULL;

-- Create clicks table for detailed analytics
CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL PRIMARY KEY,
    code VARCHAR(8) NOT NULL REFERENCES links(code) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    referrer TEXT NULL,
    user_agent TEXT NULL,
    ip_address INET NULL
);

-- Create index for click lookups by code
CREATE INDEX IF NOT EXISTS idx_clicks_code ON clicks(code);

-- Create index for time-based analytics
CREATE INDEX IF NOT EXISTS idx_clicks_time ON clicks(clicked_at DESC);

-- Create composite index for code and time
CREATE INDEX IF NOT EXISTS idx_clicks_code_time ON clicks(code, clicked_at DESC);

-- Add comments for documentation
COMMENT ON TABLE links IS 'Stores shortened URL links with soft delete support';
COMMENT ON COLUMN links.code IS 'Short code (6-8 alphanumeric characters)';
COMMENT ON COLUMN links.target_url IS 'Full destination URL';
COMMENT ON COLUMN links.is_active IS 'Soft delete flag - false means deleted';
COMMENT ON COLUMN links.deleted_at IS 'Timestamp when link was soft-deleted';

COMMENT ON TABLE clicks IS 'Detailed click tracking for analytics';
COMMENT ON COLUMN clicks.referrer IS 'HTTP Referer header from click';
COMMENT ON COLUMN clicks.user_agent IS 'User agent string for device detection';