-- Add age verification columns to orders table
ALTER TABLE orders
ADD COLUMN age_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN age_verified_at TIMESTAMP WITH TIME ZONE;