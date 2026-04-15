CREATE DATABASE IF NOT EXISTS rent_it_circle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rent_it_circle;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  city VARCHAR(150) NOT NULL,
  neighborhood VARCHAR(150) NULL,
  postal_code VARCHAR(20) NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  search_radius_km INT NOT NULL DEFAULT 15,
  local_visibility VARCHAR(30) NOT NULL DEFAULT 'neighborhood',
  account_type VARCHAR(30) NOT NULL DEFAULT 'both',
  preferred_contact_method VARCHAR(30) NOT NULL DEFAULT 'in_app',
  bio TEXT NULL,
  avatar_url TEXT NULL,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  total_ratings INT NOT NULL DEFAULT 0,
  response_rate INT NOT NULL DEFAULT 90,
  response_time_minutes INT NOT NULL DEFAULT 120,
  completed_rentals INT NOT NULL DEFAULT 0,
  last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  join_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_verifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  verification_type VARCHAR(50) NOT NULL,
  verification_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  verified_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_verifications_type (user_id, verification_type),
  CONSTRAINT fk_user_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  brand VARCHAR(120) NULL,
  `condition` VARCHAR(30) NOT NULL,
  daily_rate DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  damage_policy TEXT NULL,
  location VARCHAR(150) NOT NULL,
  neighborhood VARCHAR(150) NULL,
  postal_code VARCHAR(20) NULL,
  local_only TINYINT(1) NOT NULL DEFAULT 1,
  service_radius_km INT NOT NULL DEFAULT 10,
  handoff_type VARCHAR(30) NOT NULL DEFAULT 'pickup',
  pickup_window VARCHAR(120) NULL,
  min_rental_days INT NOT NULL DEFAULT 1,
  max_rental_days INT NOT NULL DEFAULT 14,
  rental_terms TEXT NULL,
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  images JSON NULL,
  tags JSON NULL,
  availability_status VARCHAR(30) NOT NULL DEFAULT 'available',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  views_count INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_items_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_saved_items_user_item (user_id, item_id),
  CONSTRAINT fk_saved_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_saved_items_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
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
  deposit_status VARCHAR(30) NOT NULL DEFAULT 'held',
  renter_message TEXT NULL,
  pickup_notes TEXT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rentals_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  CONSTRAINT fk_rentals_renter FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_rentals_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rental_incidents (
  id VARCHAR(36) PRIMARY KEY,
  rental_id VARCHAR(36) NOT NULL,
  reported_by_user_id VARCHAR(36) NOT NULL,
  incident_type VARCHAR(50) NOT NULL,
  severity VARCHAR(30) NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  evidence_images JSON NULL,
  deposit_claim_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  resolution_status VARCHAR(30) NOT NULL DEFAULT 'open',
  resolution_notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_rental_incidents_rental FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
  CONSTRAINT fk_rental_incidents_user FOREIGN KEY (reported_by_user_id) REFERENCES users(id) ON DELETE CASCADE
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

INSERT IGNORE INTO users (
  id, email, password_hash, full_name, phone, city, neighborhood, postal_code, latitude, longitude,
  search_radius_km, local_visibility, account_type, preferred_contact_method, bio, avatar_url,
  rating, total_ratings, response_rate, response_time_minutes, completed_rentals, last_active_at,
  join_date, is_verified, created_at, updated_at
) VALUES
  (
    'user-001', 'maya.thomas@rentitcircle.com', '$2a$10$erCY9dQZVtb7iUodIT0TEONfJ5g7I8JgAPCBEkU5kVsGKk0WCO4di',
    'Maya Thomas', '+44 7700 100001', 'London', 'Shoreditch', 'E1 6AN', 51.5245700, -0.0771900,
    12, 'neighborhood', 'both', 'in_app', 'Photographer renting out creator gear and lighting kits around East London.',
    '/uploads/avatars/maya.jpg', 4.90, 28, 97, 24, 11, '2026-04-08 10:15:00', '2025-01-14 09:30:00', 1, '2025-01-14 09:30:00', '2026-04-08 10:15:00'
  ),
  (
    'user-002', 'daniel.woods@rentitcircle.com', '$2a$10$erCY9dQZVtb7iUodIT0TEONfJ5g7I8JgAPCBEkU5kVsGKk0WCO4di',
    'Daniel Woods', '+44 7700 100002', 'London', 'Camden', 'NW1 8AB', 51.5417800, -0.1425900,
    10, 'radius', 'owner', 'phone', 'DIY enthusiast listing tools, ladders, and renovation equipment for local pickup.',
    '/uploads/avatars/daniel.jpg', 4.70, 19, 92, 42, 8, '2026-04-08 09:40:00', '2024-11-03 18:10:00', 1, '2024-11-03 18:10:00', '2026-04-08 09:40:00'
  ),
  (
    'user-003', 'priya.nair@rentitcircle.com', '$2a$10$erCY9dQZVtb7iUodIT0TEONfJ5g7I8JgAPCBEkU5kVsGKk0WCO4di',
    'Priya Nair', '+44 7700 100003', 'Manchester', 'Northern Quarter', 'M1 1AA', 53.4839600, -2.2362500,
    15, 'city', 'both', 'email', 'Event planner using the platform for portable audio, decor, and last-minute event gear.',
    '/uploads/avatars/priya.jpg', 4.80, 23, 95, 35, 9, '2026-04-07 19:25:00', '2025-02-08 12:00:00', 1, '2025-02-08 12:00:00', '2026-04-07 19:25:00'
  ),
  (
    'user-004', 'liam.carter@rentitcircle.com', '$2a$10$erCY9dQZVtb7iUodIT0TEONfJ5g7I8JgAPCBEkU5kVsGKk0WCO4di',
    'Liam Carter', '+44 7700 100004', 'Bristol', 'Clifton', 'BS8 1LX', 51.4551700, -2.6123000,
    8, 'neighborhood', 'renter', 'in_app', 'Weekend camper and cyclist renting outdoor gear instead of buying for one-off trips.',
    '/uploads/avatars/liam.jpg', 4.60, 11, 88, 58, 5, '2026-04-06 21:10:00', '2025-03-19 16:45:00', 0, '2025-03-19 16:45:00', '2026-04-06 21:10:00'
  ),
  (
    'user-005', 'zoe.bennett@rentitcircle.com', '$2a$10$erCY9dQZVtb7iUodIT0TEONfJ5g7I8JgAPCBEkU5kVsGKk0WCO4di',
    'Zoe Bennett', '+44 7700 100005', 'London', 'Hackney', 'E8 2BT', 51.5450200, -0.0553300,
    6, 'neighborhood', 'both', 'phone', 'Community host focused on trusted same-day pickups for home and event essentials.',
    '/uploads/avatars/zoe.jpg', 4.95, 31, 98, 18, 14, '2026-04-08 08:55:00', '2024-09-28 08:20:00', 1, '2024-09-28 08:20:00', '2026-04-08 08:55:00'
  );

INSERT IGNORE INTO user_verifications (
  id, user_id, verification_type, verification_status, verified_at, metadata, created_at, updated_at
) VALUES
  ('ver-001', 'user-001', 'email', 'verified', '2025-01-14 10:00:00', JSON_OBJECT('provider', 'system'), '2025-01-14 09:35:00', '2025-01-14 10:00:00'),
  ('ver-002', 'user-002', 'address', 'verified', '2024-11-04 09:20:00', JSON_OBJECT('postalCode', 'NW1 8AB'), '2024-11-03 18:20:00', '2024-11-04 09:20:00'),
  ('ver-003', 'user-003', 'email', 'verified', '2025-02-08 12:10:00', JSON_OBJECT('provider', 'system'), '2025-02-08 12:05:00', '2025-02-08 12:10:00'),
  ('ver-004', 'user-004', 'phone', 'pending', NULL, JSON_OBJECT('phone', '+44 7700 100004'), '2025-03-19 16:50:00', '2025-03-19 16:50:00'),
  ('ver-005', 'user-005', 'address', 'verified', '2024-09-28 11:10:00', JSON_OBJECT('postalCode', 'E8 2BT'), '2024-09-28 08:30:00', '2024-09-28 11:10:00');

INSERT IGNORE INTO items (
  id, owner_id, title, description, category, brand, `condition`, daily_rate, deposit_amount, damage_policy,
  location, neighborhood, postal_code, local_only, service_radius_km, handoff_type, pickup_window,
  min_rental_days, max_rental_days, rental_terms, latitude, longitude, images, tags, availability_status,
  created_at, updated_at, views_count
) VALUES
  (
    'item-001', 'user-001', 'Sony A7 IV Creator Kit',
    'Mirrorless camera body with 24-70 lens, tripod, spare battery, wireless mic and carry case for shoots, portraits, and quick brand content work.',
    'Photography', 'Sony', 'like-new', 45.00, 250.00,
    'Deposit may be partially claimed for lens scratches, missing accessories, or water damage after inspection.',
    'London', 'Shoreditch', 'E1 6AN', 1, 8, 'pickup', 'Pickup in 90 minutes',
    1, 5, 'Photo ID required at handoff. Return with all accessories charged and packed.',
    51.5245700, -0.0771900,
    JSON_ARRAY('/uploads/items/sony-a7iv-1.jpg', '/uploads/items/sony-a7iv-2.jpg'),
    JSON_ARRAY('4K video', 'Lens included', 'Fast pickup'), 'available',
    '2026-04-01 11:20:00', '2026-04-08 09:50:00', 147
  ),
  (
    'item-002', 'user-002', 'Bosch Rotary Hammer Drill Set',
    'Heavy-duty hammer drill with masonry bits, safety glasses, dust collector and extension cable for home renovation or furniture installation.',
    'Power Tools', 'Bosch', 'good', 18.00, 120.00,
    'Broken drill bits are charged only if caused by misuse. Major body damage or missing case is claimed from deposit.',
    'London', 'Camden', 'NW1 8AB', 1, 10, 'pickup', 'Same-day pickup available',
    1, 7, 'Use only on approved materials. Tool must be returned clean and in supplied hard case.',
    51.5417800, -0.1425900,
    JSON_ARRAY('/uploads/items/bosch-drill-1.jpg', '/uploads/items/bosch-drill-2.jpg'),
    JSON_ARRAY('DIY ready', 'Bit set included', 'Same day'), 'available',
    '2026-03-27 08:45:00', '2026-04-08 08:35:00', 89
  ),
  (
    'item-003', 'user-003', 'Portable DJ Speaker Bundle',
    'Two powered speakers, compact mixer, wireless microphone pair and lighting bar for birthdays, launches and small indoor events.',
    'Audio', 'JBL', 'like-new', 62.00, 300.00,
    'Speaker cone damage, lost cables, or liquid spills are charged against the deposit based on repair estimate.',
    'Manchester', 'Northern Quarter', 'M1 1AA', 0, 20, 'meetup', 'Meetup or delivery after 6pm',
    1, 4, 'Setup help available on request. Equipment must be tested with owner before return.',
    53.4839600, -2.2362500,
    JSON_ARRAY('/uploads/items/dj-bundle-1.jpg', '/uploads/items/dj-bundle-2.jpg'),
    JSON_ARRAY('Events', 'Wireless mic', 'Delivery possible'), 'available',
    '2026-03-30 15:00:00', '2026-04-07 18:20:00', 121
  ),
  (
    'item-004', 'user-005', '4-Person Camping Weekend Pack',
    'Tent, sleeping bags, gas stove, lantern, foldable chairs and rain cover for weekend camping without buying bulky gear.',
    'Outdoor', 'Quechua', 'good', 28.00, 150.00,
    'Mud and normal outdoor wear are expected. Torn fabric, broken poles or missing cookware may be deducted from deposit.',
    'London', 'Hackney', 'E8 2BT', 1, 12, 'pickup', 'Pickup evenings after 5pm',
    2, 10, 'Dry the tent before return and pack all listed items into the storage bags provided.',
    51.5450200, -0.0553300,
    JSON_ARRAY('/uploads/items/camping-pack-1.jpg', '/uploads/items/camping-pack-2.jpg'),
    JSON_ARRAY('Weekend trips', 'Family size', 'Gas stove'), 'available',
    '2026-03-21 17:40:00', '2026-04-06 10:15:00', 73
  ),
  (
    'item-005', 'user-001', 'Event Backdrop and Lighting Pack',
    'Neutral fabric backdrop, adjustable stand, ring light and compact softboxes for portraits, podcasts or home studio setup.',
    'Event Gear', 'Neewer', 'like-new', 26.00, 110.00,
    'Backdrop stains and broken light mounts are reviewed after inspection and may result in a partial deposit claim.',
    'London', 'Shoreditch', 'E1 6AN', 1, 6, 'pickup', 'Pickup within 2 hours',
    1, 6, 'Please fold backdrop carefully and return bulbs in padded case.',
    51.5239100, -0.0790800,
    JSON_ARRAY('/uploads/items/backdrop-kit-1.jpg', '/uploads/items/backdrop-kit-2.jpg'),
    JSON_ARRAY('Portrait setup', 'Quick pickup', 'Studio lighting'), 'available',
    '2026-04-02 13:10:00', '2026-04-08 09:20:00', 54
  );

INSERT IGNORE INTO saved_items (id, user_id, item_id, created_at) VALUES
  ('save-001', 'user-002', 'item-001', '2026-04-03 09:15:00'),
  ('save-002', 'user-003', 'item-005', '2026-04-04 13:10:00'),
  ('save-003', 'user-004', 'item-003', '2026-04-02 18:40:00'),
  ('save-004', 'user-005', 'item-002', '2026-04-05 08:05:00'),
  ('save-005', 'user-001', 'item-004', '2026-04-01 20:25:00');

INSERT IGNORE INTO rentals (
  id, item_id, renter_id, owner_id, start_date, end_date, total_amount, deposit_amount, deposit_status,
  renter_message, pickup_notes, status, completed_at, created_at, updated_at
) VALUES
  (
    'rental-001', 'item-004', 'user-004', 'user-005', '2026-04-03', '2026-04-06', 84.00, 150.00, 'released',
    'Planning a weekend trip to Wales and need a complete camping setup for three nights.',
    'Can collect after work on Thursday if parking is available nearby.', 'completed', '2026-04-06 20:10:00', '2026-04-01 09:00:00', '2026-04-06 20:10:00'
  ),
  (
    'rental-002', 'item-001', 'user-003', 'user-001', '2026-03-18', '2026-03-20', 90.00, 250.00, 'released',
    'Need the camera for a product launch shoot and a short interview setup.', 'Please include the wireless mic receiver.',
    'completed', '2026-03-20 21:10:00', '2026-03-14 12:30:00', '2026-03-20 21:10:00'
  ),
  (
    'rental-003', 'item-002', 'user-005', 'user-002', '2026-04-15', '2026-04-16', 18.00, 120.00, 'held',
    'Need this to mount shelves and curtain rails in a new flat this weekend.',
    'Morning pickup works best. I can return same evening if needed.', 'pending', NULL, '2026-04-08 07:55:00', '2026-04-08 07:55:00'
  ),
  (
    'rental-004', 'item-003', 'user-001', 'user-003', '2026-03-29', '2026-03-30', 62.00, 300.00, 'claimed_or_released',
    'Using this for a small community mixer with around 40 guests.', 'Need quick setup handover around 5pm.',
    'disputed', NULL, '2026-03-24 16:50:00', '2026-03-30 23:15:00'
  ),
  (
    'rental-005', 'item-005', 'user-002', 'user-001', '2026-03-25', '2026-03-26', 26.00, 110.00, 'released',
    'Need a simple portrait backdrop for headshots and a one-person interview setup.',
    'Can return before noon the next day.', 'completed', '2026-03-26 13:20:00', '2026-03-22 10:05:00', '2026-03-26 13:20:00'
  );

INSERT IGNORE INTO rental_incidents (
  id, rental_id, reported_by_user_id, incident_type, severity, description, evidence_images,
  deposit_claim_amount, resolution_status, resolution_notes, created_at, updated_at
) VALUES
  (
    'incident-001', 'rental-004', 'user-003', 'damage', 'medium',
    'One speaker grille came back dented and the right XLR cable was missing from the equipment bag.',
    JSON_ARRAY('/uploads/incidents/speaker-dent-1.jpg'), 85.00, 'reviewing',
    'Owner requested partial deposit claim while renter reviews evidence.', '2026-03-30 22:40:00', '2026-03-30 23:15:00'
  ),
  (
    'incident-002', 'rental-001', 'user-005', 'late_return', 'low',
    'Renter messaged that the return may slip by two hours because of traffic on the way back from the campsite.',
    JSON_ARRAY(), 0.00, 'resolved',
    'Item came back the same evening and no fee was charged.', '2026-04-06 18:25:00', '2026-04-06 20:05:00'
  ),
  (
    'incident-003', 'rental-002', 'user-001', 'cleaning', 'low',
    'Tripod feet came back with mud and the carry bag needed cleaning after the rental.',
    JSON_ARRAY('/uploads/incidents/tripod-cleaning-1.jpg'), 15.00, 'resolved',
    'Cleaning fee agreed and deducted after discussion.', '2026-03-20 20:30:00', '2026-03-20 21:00:00'
  ),
  (
    'incident-004', 'rental-005', 'user-002', 'other', 'low',
    'Backdrop had slight makeup marks but owner accepted professional fabric cleaning instead of a full claim.',
    JSON_ARRAY(), 10.00, 'resolved',
    'Small cleaning deduction applied and rental closed.', '2026-03-26 12:40:00', '2026-03-26 13:10:00'
  ),
  (
    'incident-005', 'rental-004', 'user-001', 'missing_item', 'medium',
    'Wireless microphone windscreen was not returned with the speaker bundle after handoff.',
    JSON_ARRAY('/uploads/incidents/missing-windscreen-1.jpg'), 12.00, 'open',
    'Renter said they may still have it and will check storage boxes.', '2026-03-30 22:55:00', '2026-03-30 22:55:00'
  );

INSERT IGNORE INTO reviews (
  id, rental_id, reviewer_id, reviewee_id, rating, comment, created_at
) VALUES
  (
    'review-001', 'rental-002', 'user-003', 'user-001', 5,
    'Camera kit was clean, fully charged, and exactly as listed. Pickup was smooth and communication was excellent.',
    '2026-03-20 22:00:00'
  ),
  (
    'review-002', 'rental-005', 'user-002', 'user-001', 5,
    'Great lighting pack for portrait work. Clear handoff instructions and a very easy return.',
    '2026-03-26 14:05:00'
  ),
  (
    'review-003', 'rental-002', 'user-001', 'user-003', 4,
    'Returned the camera on time and kept everything in good condition. Easy renter to coordinate with.',
    '2026-03-20 22:15:00'
  ),
  (
    'review-004', 'rental-005', 'user-001', 'user-002', 4,
    'Tooling questions were clear and pickup was punctual. Minor cleaning needed on return but overall reliable.',
    '2026-03-26 13:45:00'
  ),
  (
    'review-005', 'rental-001', 'user-005', 'user-004', 5,
    'Good communication throughout the trip and proactive updates when running slightly late on return.',
    '2026-04-06 20:20:00'
  );
