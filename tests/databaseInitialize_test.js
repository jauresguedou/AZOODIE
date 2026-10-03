const initializeDatabase = require("../database/initialize");

describe("database initialization", () => {
    test("creates the portfolio table and index and migrates professional addresses", async () => {
        const database = { query: jest.fn().mockResolvedValue({}) };

        await initializeDatabase(database);

        expect(database.query).toHaveBeenCalledTimes(11);
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
    });

    test("propagates schema initialization errors", async () => {
        const error = new Error("database unavailable");
        const database = { query: jest.fn().mockRejectedValue(error) };

        await expect(initializeDatabase(database)).rejects.toBe(error);
        expect(database.query).toHaveBeenCalledTimes(1);
    });
});
