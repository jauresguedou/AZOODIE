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

    test("lets the profile owner publish work and manage their portfolio posts", async () => {
        const html = await ejs.renderFile(profileTemplate, {
            professional,
            portfolioPosts: [{
                id: 33,
                caption: "Cuisine rénovée avec des finitions en bois massif.",
                media_url: "https://images.example.test/kitchen.jpg",
                media_type: "image",
                created_at: new Date("2026-06-15T12:00:00Z"),
            }],
            session: { userId: 4, professionalId: "21" },
        });

        expect(html).toContain('action="/professionals/21/portfolio"');
        expect(html).toContain('name="media"');
        expect(html).toContain('accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"');
        expect(html).toContain("Cuisine rénovée avec des finitions en bois massif.");
        expect(html).toContain('action="/professionals/21/portfolio/33/delete"');
        expect(html).toContain('src="https://images.example.test/kitchen.jpg"');
    });

    test("renders published videos publicly without exposing owner controls", async () => {
        const html = await ejs.renderFile(profileTemplate, {
            professional,
            portfolioPosts: [{
                id: 34,
                caption: "Avant et après.",
                media_url: "https://videos.example.test/renovation.mp4",
                media_type: "video",
                created_at: new Date("2026-06-15T12:00:00Z"),
            }],
            session: {},
        });

        expect(html).toContain("<video");
        expect(html).toContain('src="https://videos.example.test/renovation.mp4"');
        expect(html).toContain("Avant et après.");
        expect(html).not.toContain('action="/professionals/21/portfolio"');
        expect(html).not.toContain('action="/professionals/21/portfolio/34/delete"');
    });
});
