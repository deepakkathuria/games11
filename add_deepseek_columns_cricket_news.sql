-- Add DeepSeek-specific columns to cricket_news table
-- This allows both OpenAI and DeepSeek to process the same articles independently
-- Run this SQL in your MySQL database

-- Note: If columns already exist, you'll get an error. That's okay - just ignore it.
-- To check if columns exist first, uncomment the SELECT query below and run it.

-- Check existing columns (uncomment to run):
-- SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'cricket_news' 
-- AND COLUMN_NAME LIKE '%deepseek%';

-- Add DeepSeek columns
ALTER TABLE cricket_news 
ADD COLUMN deepseek_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN deepseek_processed_at TIMESTAMP NULL,
ADD COLUMN deepseek_ready_article LONGTEXT NULL,
ADD COLUMN deepseek_final_title VARCHAR(500) NULL,
ADD COLUMN deepseek_final_meta TEXT NULL,
ADD COLUMN deepseek_final_slug VARCHAR(500) NULL;

-- Add indexes for better performance
CREATE INDEX idx_cricket_news_deepseek_processed ON cricket_news(deepseek_processed);
CREATE INDEX idx_cricket_news_deepseek_processed_at ON cricket_news(deepseek_processed_at);

-- Verify the columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'cricket_news' 
AND COLUMN_NAME LIKE '%deepseek%';

