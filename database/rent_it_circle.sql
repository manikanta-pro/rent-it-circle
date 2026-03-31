CREATE DATABASE IF NOT EXISTS rent_it_circle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rent_it_circle;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  avatar_url TEXT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_ratings INT NOT NULL DEFAULT 0,
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_verified TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  `condition` VARCHAR(30) NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  location VARCHAR(150) NOT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  images JSON NULL,
  availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  views_count INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_items_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rentals (
  id VARCHAR(36) PRIMARY KEY,
  item_id VARCHAR(36) NOT NULL,
  renter_id VARCHAR(36) NOT NULL,
  owner_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rentals_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_rentals_renter FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rentals_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(36) PRIMARY KEY,
  rental_id VARCHAR(36) NOT NULL,
  reviewer_id VARCHAR(36) NOT NULL,
  reviewee_id VARCHAR(36) NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_reviews_rental_reviewer (rental_id, reviewer_id),
  CONSTRAINT fk_reviews_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);
