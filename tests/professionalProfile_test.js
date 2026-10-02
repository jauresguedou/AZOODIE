const ejs = require("ejs");
const path = require("path");

const profileTemplate = path.join(__dirname, "..", "views", "professionals", "profile.ejs");

describe("professional profile template", () => {
    const professional = {
        id: 21,
        name: "Awa Artisan",
        trade_category: "Menuisier bois",
        service_radius_km: 18,
        rating_avg: "4.7",
        review_count: 9,
        verified: true,
        availability_status: "available",
        photo_urls: ["https://images.example.test/awa.jpg"],
    };

    test("renders professional identity, services, rating, and contact actions", async () => {
        const html = await ejs.renderFile(profileTemplate, {
            professional,
            session: { userId: 4, professionalId: null },
        });

        expect(html).toContain("Awa Artisan");
        expect(html).toContain("Menuisier bois");
        expect(html).toContain('src="https://images.example.test/awa.jpg"');
        expect(html).toContain("Profil vérifié");
        expect(html).toContain("Disponible");
        expect(html).toContain("18 km");
        expect(html).toContain("4.7");
        expect(html).toContain("Basé sur 9 avis");
        expect(html).toContain('href="/requests/new/21"');
        expect(html).not.toContain('action="/favorites/21"');
        expect(html).not.toContain("Ajouter aux favoris");
    });

    test("provides an initials avatar, empty rating state, and owner edit link", async () => {
        const html = await ejs.renderFile(profileTemplate, {
            professional: {
                ...professional,
                name: "K",
                rating_avg: 0,
                review_count: 0,
                verified: false,
                availability_status: "busy",
                photo_urls: [],
            },
            session: { userId: 4, professionalId: "21" },
        });

        expect(html).toContain(">K</span>");
        expect(html).toContain("Aucun avis pour le moment");
        expect(html).toContain("Occupé");
        expect(html).toContain('href="/professionals/21/edit"');
        expect(html).not.toContain("Retirer des favoris");
    });

    test("does not expose edit or favorite actions to guests", async () => {
        const html = await ejs.renderFile(profileTemplate, {
            professional,
            session: {},
        });

        expect(html).not.toContain('href="/professionals/21/edit"');
        expect(html).not.toContain('action="/favorites/21"');
        expect(html).toContain('href="/requests/new/21"');
    });
});
