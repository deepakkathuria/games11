-- Create table to store generated Facebook High-CTR content
CREATE TABLE IF NOT EXISTS facebook_high_ctr_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  article_title VARCHAR(500) NOT NULL,
  article_description TEXT,
  gnews_url VARCHAR(1000),
  source_name VARCHAR(255),
  generated_content LONGTEXT NOT NULL,
  processing_time INT,
  provider VARCHAR(50) DEFAULT 'OpenAI',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_article_id (article_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
