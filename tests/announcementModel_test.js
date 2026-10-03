jest.mock("../config/database", () => ({
    query: jest.fn(),
}));

const pool = require("../config/database");
const {
    getPublishedAnnouncements,
    createAnnouncement,
    toggleAnnouncementLike,
    addAnnouncementComment,
} = require("../models/announcement-model");

describe("announcement data model", () => {
    beforeEach(() => jest.clearAllMocks());

    test("loads only published announcements with viewer like state and counts", async () => {
        pool.query.mockResolvedValue({ rows: [] });

        await getPublishedAnnouncements("19");

        expect(pool.query.mock.calls[0][0]).toContain("WHERE a.status = 'published'");
        expect(pool.query.mock.calls[0][0]).toContain("liked_by_viewer");
        expect(pool.query.mock.calls[0][1]).toEqual(["19"]);
    });

    test("toggles an existing like off", async () => {
        pool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 4 }] })
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ announcement_id: 4 }] });

        await expect(toggleAnnouncementLike(12, 4)).resolves.toEqual({ exists: true, liked: false });
        expect(pool.query).toHaveBeenCalledTimes(2);
    });

    test("creates a like for a published announcement", async () => {
        pool.query
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ id: 4 }] })
            .mockResolvedValueOnce({ rowCount: 0, rows: [] })
            .mockResolvedValueOnce({ rowCount: 1, rows: [{ announcement_id: 4 }] });

        await expect(toggleAnnouncementLike(12, 4)).resolves.toEqual({ exists: true, liked: true });
        expect(pool.query).toHaveBeenCalledTimes(3);
    });

    test("does not add a comment to a missing or unpublished announcement", async () => {
        pool.query.mockResolvedValue({ rowCount: 0, rows: [] });

        await expect(addAnnouncementComment(12, 4, "Good work")).resolves.toBe(0);
        expect(pool.query.mock.calls[0][0]).toContain("a.status = 'published'");
    });
});
