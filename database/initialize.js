const pool = require("../config/database");

async function initializeDatabase(database = pool) {
    await database.query(`
        CREATE TABLE IF NOT EXISTS professional_portfolio_posts (
            id SERIAL PRIMARY KEY,
            professional_id INTEGER NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
            caption TEXT NOT NULL DEFAULT '',
            media_url TEXT NOT NULL,
            media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
            created_at TIMESTAMP DEFAULT NOW()
        )
    `);

    await database.query(`
        CREATE INDEX IF NOT EXISTS professional_portfolio_posts_feed_idx
        ON professional_portfolio_posts(professional_id, created_at DESC)
    `);

    await database.query("ALTER TABLE professionals ADD COLUMN IF NOT EXISTS address_text VARCHAR(255)");

    await database.query(`
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
        )
    `);
    await database.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS announcements_single_demo_idx
        ON announcements(is_demo) WHERE is_demo = TRUE
    `);
    await database.query(`
        CREATE INDEX IF NOT EXISTS announcements_published_feed_idx
        ON announcements(created_at DESC) WHERE status = 'published'
    `);
    await database.query(`
        CREATE INDEX IF NOT EXISTS announcements_author_drafts_idx
        ON announcements(author_id, updated_at DESC) WHERE status = 'draft'
    `);
    await database.query(`
        CREATE TABLE IF NOT EXISTS announcement_likes (
            announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            PRIMARY KEY (announcement_id, user_id)
        )
    `);
    await database.query(`
        CREATE TABLE IF NOT EXISTS announcement_comments (
            id SERIAL PRIMARY KEY,
            announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            body VARCHAR(1000) NOT NULL CHECK (length(trim(body)) > 0),
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
    `);
    await database.query(`
        CREATE INDEX IF NOT EXISTS announcement_comments_feed_idx
        ON announcement_comments(announcement_id, created_at ASC)
    `);
    await database.query(`
        INSERT INTO announcements
            (author_label, title, category, description, address_text, status, is_demo)
        VALUES (
            'AZÔÔDIÉ · Exemple',
            'Projet de démonstration : rénover une cuisine à Cotonou',
            'Menuisier bois',
            'Nous souhaitons rénover une cuisine familiale : concevoir et poser des rangements sur mesure, optimiser l’espace disponible et proposer des finitions durables. Les professionnels intéressés peuvent présenter leur expérience et leurs réalisations en commentaire.',
            'Cotonou, Bénin',
            'published',
            TRUE
        )
        ON CONFLICT (is_demo) WHERE is_demo = TRUE DO NOTHING
    `);
}

module.exports = initializeDatabase;
