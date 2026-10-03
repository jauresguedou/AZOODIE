CREATE TABLE IF NOT EXISTS professionals (
    id  SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    trade_category VARCHAR(80) NOT NULL,
    service_radius_km  NUMERIC(5, 2) DEFAULT 15,
    base_lat  NUMERIC(9,6) NOT NULL,
    base_lng  NUMERIC(9,6) NOT NULL,
    rating_avg NUMERIC(2, 1) DEFAULT 0,
    review_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(20) DEFAULT 'available',
    photo_urls TEXT[],
    created_at TIMESTAMP DEFAULT NOW()

);

ALTER TABLE professionals ADD COLUMN IF NOT EXISTS service_radius_km NUMERIC(5, 2) DEFAULT 15;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(2, 1) DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available';
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS professional_portfolio_posts (
    id SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    caption TEXT NOT NULL DEFAULT '',
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_portfolio_posts_feed_idx
    ON professional_portfolio_posts(professional_id, created_at DESC);



CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,
    email             VARCHAR(255)  UNIQUE NOT NULL,
    password_hash     VARCHAR(255)NOT NULL,
    role              VARCHAR(20) NOT NULL DEFAULT 'client',
    professional_id  INTEGER CONSTRAINT users_professional_id_fkey REFERENCES professionals(id) ON DELETE SET NULL,
    created_at       TIMESTAMP DEFAULT NOW()

);

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'client';
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();


CREATE TABLE IF NOT EXISTS requests (
    id  SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    address_text VARCHAR(255),
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    budget_estimate NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE requests ADD COLUMN IF NOT EXISTS budget_estimate NUMERIC(12, 2);
ALTER TABLE requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open';
ALTER TABLE requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS place_cache (

    id SERIAL PRIMARY KEY,
    place_id VARCHAR(150) UNIQUE,
    formatted_address VARCHAR(255),
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    search_query VARCHAR(255),
    results JSONB,
    last_fetched_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS formatted_address VARCHAR(255);
ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS lat NUMERIC(9,6);
ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS lng NUMERIC(9,6);
ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMP DEFAULT NOW();
ALTER TABLE place_cache ALTER COLUMN place_id DROP NOT NULL;
ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS search_query VARCHAR(255);
ALTER TABLE place_cache ADD COLUMN IF NOT EXISTS results JSONB;
CREATE UNIQUE INDEX IF NOT EXISTS place_cache_search_query_key
    ON place_cache(search_query);


CREATE TABLE IF NOT EXISTS route_cache (
    id SERIAL PRIMARY KEY,
    origin_lat NUMERIC(9,6) NOT NULL,
    origin_lng NUMERIC(9,6) NOT NULL,
    dest_lat NUMERIC(9,6) NOT NULL,
    dest_lng NUMERIC(9,6) NOT NULL,
    distance_m INT,
    duration_s INT,
    geometry JSONB,
    fetched_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE route_cache ADD COLUMN IF NOT EXISTS distance_m INT;
ALTER TABLE route_cache ADD COLUMN IF NOT EXISTS duration_s INT;
ALTER TABLE route_cache ADD COLUMN IF NOT EXISTS geometry JSONB;
ALTER TABLE route_cache ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(client_id, professional_id)

);

ALTER TABLE favorites ADD COLUMN IF NOT EXISTS saved_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notifications (

    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
    ON notifications(user_id, is_read);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_professional_id_fkey'
          AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users
            ADD CONSTRAINT users_professional_id_fkey
            FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE SET NULL;
    END IF;
END;
$$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255);

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);