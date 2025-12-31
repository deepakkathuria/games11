-- Create brand_car_news table for multiple car brands
-- This table stores car news from Hyundai, Tata Motors, Maruti Suzuki, and Mahindra

CREATE TABLE IF NOT EXISTS brand_car_news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(100) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content LONGTEXT,
  source_name VARCHAR(255),
  source_url VARCHAR(1000),
  published_at DATETIME,
  published_at_iso VARCHAR(100),
  word_count INT DEFAULT 0,
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- OpenAI processing columns
  openai_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP NULL,
  processed_at_iso VARCHAR(100) NULL,
  openai_ready_article LONGTEXT NULL,
  openai_final_title VARCHAR(500) NULL,
  openai_final_meta TEXT NULL,
  openai_final_slug VARCHAR(500) NULL,
  openai_recommendations JSON NULL,
  
  -- Indexes for better performance
  INDEX idx_brand_car_news_brand (brand_name),
  INDEX idx_brand_car_news_title (title(255)),
  INDEX idx_brand_car_news_source_url (source_url(255)),
  INDEX idx_brand_car_news_published_at (published_at),
  INDEX idx_brand_car_news_is_valid (is_valid),
  INDEX idx_brand_car_news_openai_processed (openai_processed),
  INDEX idx_brand_car_news_processed_at (processed_at),
  
  -- Unique constraint to prevent duplicates
  UNIQUE KEY unique_brand_car_news (brand_name, title(255), source_url(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

