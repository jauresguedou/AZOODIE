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

    // Construction projects
    await database.query(`
        CREATE TABLE IF NOT EXISTS construction_projects (
            id SERIAL PRIMARY KEY,
            owner_id INTEGER NOT NULL
                REFERENCES users(id) ON DELETE RESTRICT,
            title VARCHAR(180) NOT NULL
                CHECK (length(trim(title)) > 0),
            description TEXT,
            address_text VARCHAR(255) NOT NULL,
            department VARCHAR(100),
            commune VARCHAR(100),
            budget_estimate NUMERIC(14, 2)
                CHECK (budget_estimate IS NULL OR budget_estimate >= 0),
            start_date DATE,
            target_end_date DATE,
            status VARCHAR(20) NOT NULL DEFAULT 'planning'
                CHECK (status IN (
                    'planning',
                    'in_progress',
                    'paused',
                    'completed',
                    'cancelled'
                )),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CHECK (
                start_date IS NULL
                OR target_end_date IS NULL
                OR target_end_date >= start_date
            )
        )
    `);

    await database.query(`
        CREATE INDEX IF NOT EXISTS construction_projects_owner_idx
        ON construction_projects(owner_id, created_at DESC)
    `);


    // Add construction progress to existing projects safely.
    await database.query(`
        ALTER TABLE construction_projects
        ADD COLUMN IF NOT EXISTS progress_percentage INTEGER
        NOT NULL DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100)
    `);


    // Users assigned to a project, with project-specific permissions
    await database.query(`
        CREATE TABLE IF NOT EXISTS construction_project_members (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL
                REFERENCES construction_projects(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL
                REFERENCES users(id) ON DELETE RESTRICT,
            member_role VARCHAR(20) NOT NULL
                CHECK (member_role IN ('site_manager', 'viewer')),
            invited_by INTEGER
                REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (project_id, user_id)
        )
    `);



    
    // Add invitation status without removing existing project members.
    // Existing members remain active; new invitations must explicitly use "pending".
    await database.query(`
        ALTER TABLE construction_project_members
        ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(20)
        NOT NULL DEFAULT 'accepted'
        CHECK (
            invitation_status IN ('pending', 'accepted', 'revoked')
        )
    `);

    await database.query(`
        ALTER TABLE construction_project_members
        DROP CONSTRAINT IF EXISTS construction_project_members_invitation_status_check
    `);

    await database.query(`
        ALTER TABLE construction_project_members
        ADD CONSTRAINT construction_project_members_invitation_status_check
        CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked'))
    `);

    await database.query(`
        ALTER TABLE construction_project_members
        ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ
    `);

    // Preserve existing access and record when legacy memberships began.
    await database.query(`
        UPDATE construction_project_members
        SET accepted_at = created_at
        WHERE invitation_status = 'accepted'
          AND accepted_at IS NULL
    `);


    await database.query(`
        CREATE INDEX IF NOT EXISTS construction_project_members_user_idx
        ON construction_project_members(user_id, project_id)
    `);

    // Daily reports for construction projects
    await database.query(`
        CREATE TABLE IF NOT EXISTS construction_daily_reports (
            id SERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL
                REFERENCES construction_projects(id) ON DELETE CASCADE,
            author_id INTEGER NOT NULL
                REFERENCES users(id) ON DELETE RESTRICT,
            report_date DATE NOT NULL DEFAULT CURRENT_DATE,
            work_completed TEXT NOT NULL
                CHECK (length(trim(work_completed)) > 0),
            workers_count INTEGER
                CHECK (workers_count IS NULL OR workers_count >= 0),
            materials_used TEXT,
            difficulties TEXT,
            notes TEXT,
            progress_percentage INTEGER NOT NULL DEFAULT 0
                CHECK (progress_percentage BETWEEN 0 AND 100),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    // Add progress to existing daily reports without deleting data.
    await database.query(`
        ALTER TABLE construction_daily_reports
        ADD COLUMN IF NOT EXISTS progress_percentage INTEGER
        NOT NULL DEFAULT 0
        CHECK (progress_percentage BETWEEN 0 AND 100)
    `);

    await database.query(`
        CREATE INDEX IF NOT EXISTS construction_daily_reports_project_date_idx
        ON construction_daily_reports(project_id, report_date DESC, id DESC)
    `);



    // Photos and videos attached to daily construction reports
    await database.query(`
        CREATE TABLE IF NOT EXISTS construction_daily_report_media (
            id SERIAL PRIMARY KEY,
            report_id INTEGER NOT NULL
                REFERENCES construction_daily_reports(id) ON DELETE CASCADE,
            media_url TEXT NOT NULL,
            public_id TEXT NOT NULL,
            media_type VARCHAR(10) NOT NULL
                CHECK (media_type IN ('image', 'video')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await database.query(`
        CREATE INDEX IF NOT EXISTS construction_daily_report_media_report_idx
        ON construction_daily_report_media(report_id, created_at ASC, id ASC)
    `);


 }

module.exports = initializeDatabase;
