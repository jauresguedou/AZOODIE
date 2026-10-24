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
ALTER TABLE professionals ADD COLUMN IF NOT EXISTS address_text VARCHAR(255);

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

CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    author_label VARCHAR(150),
    title VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    address_text VARCHAR(255),
    media_url TEXT,
    media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CHECK ((media_url IS NULL AND media_type IS NULL) OR (media_url IS NOT NULL AND media_type IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS announcements_single_demo_idx
    ON announcements(is_demo) WHERE is_demo = TRUE;
CREATE INDEX IF NOT EXISTS announcements_published_feed_idx
    ON announcements(created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS announcements_author_drafts_idx
    ON announcements(author_id, updated_at DESC) WHERE status = 'draft';

CREATE TABLE IF NOT EXISTS announcement_likes (
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE IF NOT EXISTS announcement_comments (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body VARCHAR(1000) NOT NULL CHECK (length(trim(body)) > 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS announcement_comments_feed_idx
    ON announcement_comments(announcement_id, created_at ASC);

INSERT INTO announcements
    (author_label, title, category, description, address_text, status, is_demo)
SELECT
    'AZÔÔDIÉ · Exemple',
    'Projet de démonstration : rénover une cuisine à Cotonou',
    'Menuisier bois',
    'Nous souhaitons rénover une cuisine familiale : concevoir et poser des rangements sur mesure, optimiser l’espace disponible et proposer des finitions durables. Les professionnels intéressés peuvent présenter leur expérience et leurs réalisations en commentaire.',
    'Cotonou, Bénin',
    'published',
    TRUE
WHERE NOT EXISTS (SELECT 1 FROM announcements WHERE is_demo = TRUE);


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


CREATE TABLE IF NOT EXISTS professional_credentials (
    id               SERIAL PRIMARY KEY,
    professional_id  INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    credential_type  VARCHAR(20) NOT NULL CHECK (credential_type IN ('certification', 'insurance')),
    title            VARCHAR(150) NOT NULL,
    issuing_body     VARCHAR(150),
    document_url     TEXT NOT NULL,
    expiry_date      DATE,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS professional_credentials_idx
    ON professional_credentials(professional_id, credential_type);




    -- 1. Remove the existing CHECK constraint
ALTER TABLE professional_credentials
DROP CONSTRAINT IF EXISTS professional_credentials_credential_type_check;

-- 2. Expand the allowed credential types
ALTER TABLE professional_credentials
ADD CONSTRAINT professional_credentials_credential_type_check
CHECK (
    credential_type IN (
        'certification',
        'insurance',
        'diploma',
        'professional_certificate',
        'technical_diploma',
        'higher_education',
        'safety_certificate'
    )
);



ALTER TABLE requests ADD COLUMN IF NOT EXISTS professional_id INTEGER REFERENCES professionals(id) ON DELETE SET NULL;


CREATE TABLE IF NOT EXISTS reviews (
    id              SERIAL PRIMARY KEY,
    professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    client_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id      INTEGER REFERENCES requests(id) ON DELETE SET NULL,
    rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE (client_id, professional_id)
);



BEGIN;

-- 1. Supplier profiles
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE
        REFERENCES users(id) ON DELETE RESTRICT,

    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    description TEXT,

    department VARCHAR(80) NOT NULL,
    commune VARCHAR(100) NOT NULL,
    address_text TEXT,
    logo_url VARCHAR(500),

    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Shared materials catalogue
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    brand VARCHAR(100),
    specification VARCHAR(150),
    unit VARCHAR(40) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (name, brand, specification, unit)
);

-- 3. Offers published by suppliers
CREATE TABLE IF NOT EXISTS supplier_offers (
    id SERIAL PRIMARY KEY,

    supplier_id INTEGER NOT NULL
        REFERENCES suppliers(id) ON DELETE RESTRICT,

    material_id INTEGER NOT NULL
        REFERENCES materials(id) ON DELETE RESTRICT,

    price_fcfa NUMERIC(14, 2) NOT NULL
        CHECK (price_fcfa > 0),

    stock_quantity NUMERIC(14, 2)
        CHECK (stock_quantity >= 0),

    stock_status VARCHAR(20) NOT NULL DEFAULT 'unknown'
        CHECK (
            stock_status IN (
                'available',
                'limited',
                'out_of_stock',
                'unknown'
            )
        ),

    delivery_available BOOLEAN NOT NULL DEFAULT FALSE,
    delivery_details TEXT,

    offer_status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (
            offer_status IN ('active', 'paused', 'expired')
        ),

    last_price_update TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for marketplace searches
CREATE INDEX IF NOT EXISTS idx_materials_category
    ON materials(category);

CREATE INDEX IF NOT EXISTS idx_suppliers_location
    ON suppliers(department, commune);

CREATE INDEX IF NOT EXISTS idx_supplier_offers_material_status
    ON supplier_offers(material_id, offer_status);

CREATE INDEX IF NOT EXISTS idx_supplier_offers_supplier
    ON supplier_offers(supplier_id);

COMMIT;




INSERT INTO materials
    (name, category, description, brand, specification, unit)
VALUES
    ('Ciment', 'Ciment',
     'Matériau de construction', NULL, 'Sac de 50 kg', 'sac'),

    ('Fer à béton', 'Fer et acier',
     'Acier pour béton armé', NULL, 'Diamètre à préciser', 'barre'),

    ('Sable', 'Sable et gravier',
     'Sable de construction', NULL, 'Granulométrie à préciser', 'm³'),

    ('Gravier', 'Sable et gravier',
     'Gravier pour travaux de construction', NULL, 'Granulométrie à préciser', 'm³'),

    ('Peinture', 'Peinture',
     'Peinture pour bâtiment', NULL, 'Type à préciser', 'litre')
ON CONFLICT (name, brand, specification, unit) DO NOTHING;