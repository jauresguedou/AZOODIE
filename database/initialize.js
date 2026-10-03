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

    await database.query("ALTER TABLE requests ADD COLUMN IF NOT EXISTS work_title VARCHAR(150)");
    await database.query("ALTER TABLE requests ADD COLUMN IF NOT EXISTS professional_requirements TEXT");
    await database.query("ALTER TABLE requests ADD COLUMN IF NOT EXISTS project_timeline VARCHAR(100)");
}

module.exports = initializeDatabase;
