-- Migration script to add Nuvana licensing fields to existing database
-- Run this if you're upgrading from the old licensing system

-- Check if columns exist before adding them
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so this needs to be done carefully

-- Add Nuvana-specific fields to license_state table
ALTER TABLE license_state ADD COLUMN license_key TEXT;
ALTER TABLE license_state ADD COLUMN customer_email TEXT;
ALTER TABLE license_state ADD COLUMN activation_id TEXT;
ALTER TABLE license_state ADD COLUMN offline_certificate TEXT;

-- Update any existing trial licenses to have proper structure
UPDATE license_state 
SET last_seen_monotonic = 0 
WHERE last_seen_monotonic IS NULL;

-- Note: After running this migration, users will need to:
-- 1. Obtain a new Nuvana license key
-- 2. Activate it in the application
-- 3. Their existing plan and expiry date will be preserved
