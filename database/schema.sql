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



CREATE TABLE IF NOT EXISTS users (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(150) NOT NULL,
    email             VARCHAR(255)  UNIQUE NOT NULL,
    password_hash     VARCHAR(255)NOT NULL,
    role              VARCHAR(20) NOT NULL DEFAULT 'client',
    professional_id  INTERGER REFERENCES professionals(id) ON DELETE SET NULL,
    created_at       TIMESTAMP DEFAULT NOW()

);


CREATE TABLE IF NOT EXISTS requests (
    id  SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    address_text VARCHAR(255),
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    budget_estimate NUMERIC(12, 2),
    status VARCHAR(20) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
);


CREATE TABLE IF NOT EXISTS place_cache (

    id SERIAL PRIMARY KEY,
    place_id VARCHAR(150) UNIQUE NOT NULL,
    formatted_address VARCHAR(255),
    lat NUMERIC(9,6),
    lng NUMERIC(9,6),
    last_fetched_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS route_cache (
    id SERIAL PRIMARY KEY,
    origin_lat NUMERIC(9,6) NOT NULL,
    origin_lng NUMERIC(9,6) NOT NULL,
    destination_lat NUMERIC(9,6) NOT NULL,
    destination_lng NUMERIC(9,6) NOT NULL,
    distance_meters INT,
    duration_seconds INT,
    geometry JSONB,
    fetched_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    professional_id INT NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    UNIQUE(client_id, professional_id)

);