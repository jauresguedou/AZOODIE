const initializeDatabase = require("../database/initialize");

describe("database initialization", () => {
    test("creates the portfolio table and feed index idempotently", async () => {
        const database = { query: jest.fn().mockResolvedValue({}) };

        await initializeDatabase(database);

        expect(database.query).toHaveBeenCalledTimes(2);
        expect(database.query.mock.calls[0][0]).toContain("CREATE TABLE IF NOT EXISTS professional_portfolio_posts");
        expect(database.query.mock.calls[0][0]).toContain("REFERENCES professionals(id) ON DELETE CASCADE");
        expect(database.query.mock.calls[0][0]).toContain("CHECK (media_type IN ('image', 'video'))");
        expect(database.query.mock.calls[1][0]).toContain("CREATE INDEX IF NOT EXISTS professional_portfolio_posts_feed_idx");
    });

    test("propagates schema initialization errors", async () => {
        const error = new Error("database unavailable");
        const database = { query: jest.fn().mockRejectedValue(error) };

        await expect(initializeDatabase(database)).rejects.toBe(error);
        expect(database.query).toHaveBeenCalledTimes(1);
    });
});
