jest.mock("../config/database", () => ({
    query: jest.fn(),
}));

const pool = require("../config/database");
const { createProfessional, updateProfessional } = require("../models/professional-model");

describe("professional address persistence", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        pool.query.mockResolvedValue({ rows: [{ id: 12 }] });
    });

    test("includes readable address in professional creation", async () => {
        await createProfessional({
            name: "Awa Artisan",
            trade_category: "Menuisier bois",
            service_radius_km: 15,
            base_lat: "6.3703",
            base_lng: "2.3912",
            address_text: "Cotonou",
            verified: false,
            availability_status: "available",
            photo_urls: [],
        });

        expect(pool.query.mock.calls[0][0]).toContain("base_lat, base_lng, address_text, verified");
        expect(pool.query.mock.calls[0][0]).toContain("$1, $2, $3, $4, $5, $6, $7, $8, $9");
        expect(pool.query.mock.calls[0][1]).toEqual(expect.arrayContaining(["Cotonou"]));
        expect(pool.query.mock.calls[0][1][5]).toBe("Cotonou");
    });

    test("updates the readable address alongside the existing professional fields", async () => {
        await updateProfessional("12", {
            name: "Awa Artisan",
            trade_category: "Menuisier bois",
            service_radius_km: 15,
            base_lat: "6.3703",
            base_lng: "2.3912",
            address_text: "Fidjrossè, Cotonou",
            availability_status: "available",
        });

        expect(pool.query.mock.calls[0][0]).toContain("address_text = $6");
        expect(pool.query.mock.calls[0][0]).toContain("WHERE id = $8");
        expect(pool.query.mock.calls[0][1]).toEqual([
            "Awa Artisan",
            "Menuisier bois",
            15,
            "6.3703",
            "2.3912",
            "Fidjrossè, Cotonou",
            "available",
            "12",
        ]);
    });
});
