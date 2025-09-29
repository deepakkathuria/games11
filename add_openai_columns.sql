-- Add OpenAI-specific columns to general_news table
-- This allows both DeepSeek and OpenAI to process the same articles independently

ALTER TABLE general_news 
ADD COLUMN openai_processed BOOLEAN DEFAULT FALSE,
ADD COLUMN openai_processed_at TIMESTAMP NULL,
ADD COLUMN openai_ready_article LONGTEXT NULL,
ADD COLUMN openai_final_title VARCHAR(500) NULL,
ADD COLUMN openai_final_meta TEXT NULL,
ADD COLUMN openai_final_slug VARCHAR(500) NULL;

-- Add indexes for better performance
CREATE INDEX idx_general_news_openai_processed ON general_news(openai_processed);
CREATE INDEX idx_general_news_openai_processed_at ON general_news(openai_processed_at);
