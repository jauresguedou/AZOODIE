const initializeDatabase = require("../database/initialize");

describe("database initialization", () => {
    test("creates the portfolio table and index and migrates professional addresses", async () => {
        const database = { query: jest.fn().mockResolvedValue({}) };

        await initializeDatabase(database);

        expect(database.query).toHaveBeenCalledTimes(26);

        expect(database.query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS professional_portfolio_posts");
        expect(database.query.mock.calls[0][0]).toContain("REFERENCES professionals(id) ON DELETE CASCADE");
        expect(database.query.mock.calls[0][0]).toContain("CHECK (media_type IN ('image', 'video'))");
        expect(database.query.mock.calls[1][0]).toContain("CREATE INDEX IF NOT EXISTS professional_portfolio_posts_feed_idx");
        expect(database.query.mock.calls[2][0]).toContain("ALTER TABLE professionals ADD COLUMN IF NOT EXISTS address_text VARCHAR(255)");
        expect(database.query.mock.calls[3][0]).toContain("CREATE TABLE IF NOT EXISTS announcements");
        expect(database.query.mock.calls[3][0]).toContain("REFERENCES users(id) ON DELETE CASCADE");
        expect(database.query.mock.calls[7][0]).toContain("CREATE TABLE IF NOT EXISTS announcement_likes");
        expect(database.query.mock.calls[8][0]).toContain("CREATE TABLE IF NOT EXISTS announcement_comments");
        expect(database.query.mock.calls[10][0]).toContain("ON CONFLICT (is_demo) WHERE is_demo = TRUE DO NOTHING");

        expect(database.query.mock.calls[11][0]).toContain("CREATE TABLE IF NOT EXISTS construction_projects");
        expect(database.query.mock.calls[11][0]).toContain("REFERENCES users(id) ON DELETE RESTRICT");
        expect(database.query.mock.calls[12][0]).toContain("construction_projects_owner_idx");

        expect(database.query.mock.calls[13][0]).toContain("ALTER TABLE construction_projects");
        expect(database.query.mock.calls[13][0]).toContain("ADD COLUMN IF NOT EXISTS progress_percentage INTEGER");
        expect(database.query.mock.calls[13][0]).toContain("CHECK (progress_percentage BETWEEN 0 AND 100)");

        expect(database.query.mock.calls[14][0]).toContain("CREATE TABLE IF NOT EXISTS construction_project_members");
        expect(database.query.mock.calls[14][0]).toContain("member_role IN ('site_manager', 'viewer')");

        expect(database.query.mock.calls[15][0]).toContain("ADD COLUMN IF NOT EXISTS invitation_status VARCHAR(20)");
        expect(database.query.mock.calls[15][0]).toContain("'pending', 'accepted', 'revoked'");

        expect(database.query.mock.calls[16][0]).toContain("DROP CONSTRAINT IF EXISTS construction_project_members_invitation_status_check");
        expect(database.query.mock.calls[17][0]).toContain("ADD CONSTRAINT construction_project_members_invitation_status_check");
        expect(database.query.mock.calls[17][0]).toContain("'pending', 'accepted', 'declined', 'revoked'");

        expect(database.query.mock.calls[18][0]).toContain("ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ");
        expect(database.query.mock.calls[19][0]).toContain("UPDATE construction_project_members");
        expect(database.query.mock.calls[19][0]).toContain("SET accepted_at = created_at");
        expect(database.query.mock.calls[20][0]).toContain("construction_project_members_user_idx");

        expect(database.query.mock.calls[21][0]).toContain("CREATE TABLE IF NOT EXISTS construction_daily_reports");
        expect(database.query.mock.calls[21][0]).toContain("REFERENCES construction_projects(id) ON DELETE CASCADE");
        expect(database.query.mock.calls[21][0]).toContain("REFERENCES users(id) ON DELETE RESTRICT");

        expect(database.query.mock.calls[22][0]).toContain("ALTER TABLE construction_daily_reports");
        expect(database.query.mock.calls[22][0]).toContain("ADD COLUMN IF NOT EXISTS progress_percentage INTEGER");
        expect(database.query.mock.calls[22][0]).toContain("CHECK (progress_percentage BETWEEN 0 AND 100)");

        expect(database.query.mock.calls[23][0]).toContain("construction_daily_reports_project_date_idx");
        expect(database.query.mock.calls[24][0]).toContain("CREATE TABLE IF NOT EXISTS construction_daily_report_media");
        expect(database.query.mock.calls[24][0]).toContain("REFERENCES construction_daily_reports(id) ON DELETE CASCADE");
        expect(database.query.mock.calls[25][0]).toContain("construction_daily_report_media_report_idx");
    });

    test("propagates schema initialization errors", async () => {
        const error = new Error("database unavailable");
        const database = { query: jest.fn().mockRejectedValue(error) };

        await expect(initializeDatabase(database)).rejects.toBe(error);
        expect(database.query).toHaveBeenCalledTimes(1);
    });
});
